import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { AiModule } from '../ai';

@Module({
  imports: [AiModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
