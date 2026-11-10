import type { AuthedRequest } from '../../common/auth/authed-request';
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionRequestDto } from './dto/vision-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit } from '../../common/rate-limit';

@Controller('vision')
@UseGuards(AuthGuard('jwt'))
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('identify')
  @RateLimit('ai')
  async identify(
    @Request() req: AuthedRequest,
    @Body() visionRequestDto: VisionRequestDto,
  ) {
    return this.visionService.identifyPlant(req.user.id, visionRequestDto);
  }

  @Post('diagnose')
  @RateLimit('ai')
  async diagnose(
    @Request() req: AuthedRequest,
    @Body() visionRequestDto: VisionRequestDto,
  ) {
    return this.visionService.diagnosePlant(req.user.id, visionRequestDto);
  }
}
