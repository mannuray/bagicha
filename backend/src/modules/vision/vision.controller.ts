import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionRequestDto } from './dto/vision-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('vision')
@UseGuards(AuthGuard('jwt'))
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('identify')
  async identify(@Body() visionRequestDto: VisionRequestDto) {
    return this.visionService.identifyPlant(visionRequestDto);
  }

  @Post('diagnose')
  async diagnose(@Body() visionRequestDto: VisionRequestDto) {
    return this.visionService.diagnosePlant(visionRequestDto);
  }
}
