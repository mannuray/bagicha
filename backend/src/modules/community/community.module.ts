import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { VisionModule } from '../vision/vision.module';

@Module({
  imports: [VisionModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
