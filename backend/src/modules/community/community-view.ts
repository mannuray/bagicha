import { pickFields } from '../../common/http/pick-fields';

/** A post as other gardeners see it: its words and where, never moderation flags. */
export const POST_FIELDS = [
  'id',
  'author_id',
  'plant_id',
  'content',
  'image_urls',
  'district',
  'is_alert',
  'upvotes',
  'created_at',
  '_count',
] as const;
export const COMMENT_FIELDS = [
  'id',
  'post_id',
  'author_id',
  'content',
  'is_expert_verified',
  'created_at',
] as const;

type Of<F extends readonly string[]> = { [K in F[number]]?: unknown };

export const toPostView = <T extends Of<typeof POST_FIELDS>>(post: T) =>
  pickFields(post, POST_FIELDS as unknown as readonly (keyof T)[]);
export const toCommentView = <T extends Of<typeof COMMENT_FIELDS>>(
  comment: T,
) => pickFields(comment, COMMENT_FIELDS as unknown as readonly (keyof T)[]);
