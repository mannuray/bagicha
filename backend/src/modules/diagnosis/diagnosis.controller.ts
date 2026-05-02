import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinalizeDiagnosisDto } from './dto/finalize-diagnosis.dto';
import { DiagnosisPipelineService } from './services/diagnosis-pipeline.service';

@Controller('diagnosis')
@UseGuards(AuthGuard('jwt'))
export class DiagnosisController {
  constructor(private readonly pipeline: DiagnosisPipelineService) {}

  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  async finalize(@Body() dto: FinalizeDiagnosisDto) {
    const result = await this.pipeline.finalize(dto);
    return { success: true, data: result };
  }
}
