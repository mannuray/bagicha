import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinalizeDiagnosisDto } from './dto/finalize-diagnosis.dto';
import { DiagnosisPipelineService } from './services/diagnosis-pipeline.service';
import { RateLimit } from '../../common/rate-limit';

@Controller('diagnosis')
@UseGuards(AuthGuard('jwt'))
export class DiagnosisController {
  constructor(private readonly pipeline: DiagnosisPipelineService) {}

  @Post('finalize')
  @RateLimit('ai')
  @HttpCode(HttpStatus.OK)
  async finalize(
    @Request() req: AuthedRequest,
    @Body() dto: FinalizeDiagnosisDto,
  ) {
    return this.pipeline.finalize(req.user.id, dto);
  }
}
