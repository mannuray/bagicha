import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { CropsService } from './crops.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class CropsController {
  constructor(private readonly crops: CropsService) {}

  @Get('crops/calendar')
  calendar(@Request() req: AuthedRequest) {
    return this.crops.calendar(req.user);
  }
}
