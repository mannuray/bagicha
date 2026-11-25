import { Injectable } from '@nestjs/common';
import { NotFoundError, ValidationError } from '../../common/errors';
import { Page, PageQuery, toPage, toSkipTake } from '../../common/pagination';
import { PlantRecordService } from '../plant-ledger';
import { UserRepository } from '../user';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CommentRepository } from './repositories/comment.repository';
import { ExpertRepository } from './repositories/expert.repository';
import { FeedPost, PostRepository } from './repositories/post.repository';
import { MediaService, parseMediaKey } from '../media';

@Injectable()
export class CommunityService {
  constructor(
    private readonly posts: PostRepository,
    private readonly comments: CommentRepository,
    private readonly experts: ExpertRepository,
    private readonly users: UserRepository,
    private readonly plants: PlantRecordService,
    private readonly media: MediaService,
  ) {}

  async getFeed(
    userId: string,
    district: string | undefined,
    q: PageQuery,
  ): Promise<Page<FeedPost>> {
    const targetDistrict =
      district || (await this.users.findById(userId))?.district;
    const { rows, total } = await this.posts.listVisible(
      targetDistrict,
      toSkipTake(q),
    );
    return toPage(
      rows.map((post) => this.withOwnImages(post)),
      total,
      q,
    );
  }

  async createPost(userId: string, dto: CreatePostDto) {
    if (dto.plant_id) await this.plants.getOwnedOrThrow(userId, dto.plant_id);
    const imageUrls = (dto.image_keys ?? []).map((key) => {
      const parsed = parseMediaKey(key);
      if (parsed?.kind !== 'post' || parsed.ownerId !== userId) {
        throw new ValidationError(
          'POST_IMAGE_INVALID',
          'Images must be your own post uploads',
        );
      }
      return this.media.publicUrlFor(key);
    });
    const user = await this.users.findById(userId);
    return this.posts.create({
      content: dto.content,
      plant_id: dto.plant_id,
      is_alert: dto.is_alert ?? false,
      image_urls: imageUrls,
      author_id: userId,
      district: user?.district,
    });
  }

  /** Posts saved before keys were enforced may hold any address: show only ours. */
  private withOwnImages<T extends { image_urls: string[] }>(post: T): T {
    return {
      ...post,
      image_urls: post.image_urls.filter((url) =>
        this.media.isOwnPublicUrl(url),
      ),
    };
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    // Checked first: otherwise a missing post is a foreign-key failure (a 500).
    const post = await this.posts.findVisible(postId);
    if (!post) throw new NotFoundError('POST_NOT_FOUND', 'Post not found');
    return this.comments.create({
      ...dto,
      post_id: postId,
      author_id: userId,
      is_expert_verified: await this.experts.isApprovedExpert(userId),
    });
  }
}
