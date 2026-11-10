import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionRequestDto } from './dto/vision-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('vision')
@UseGuards(AuthGuard('jwt'))
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('identify')
  async identify(@Request() req, @Body() visionRequestDto: VisionRequestDto) {
    return this.visionService.identifyPlant(req.user.id, visionRequestDto);
  }

  @Post('diagnose')
  async diagnose(@Request() req, @Body() visionRequestDto: VisionRequestDto) {
    return this.visionService.diagnosePlant(req.user.id, visionRequestDto);
  }
}
