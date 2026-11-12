import { Module } from '@nestjs/common';
import { AiModule } from '../ai';
import { PlantLedgerModule } from '../plant-ledger';
import { UserModule } from '../user';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommentRepository } from './repositories/comment.repository';
import { ExpertRepository } from './repositories/expert.repository';
import { PostRepository } from './repositories/post.repository';
import { MediaModule } from '../media';
import { ReportRepository } from './repositories/report.repository';

@Module({
  imports: [AiModule, MediaModule, PlantLedgerModule, UserModule],
  controllers: [CommunityController],
  providers: [
    CommunityService,
    PostRepository,
    CommentRepository,
    ReportRepository,
    ExpertRepository,
  ],
})
export class CommunityModule {}
