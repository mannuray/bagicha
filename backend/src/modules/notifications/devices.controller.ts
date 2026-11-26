import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { Clock } from '../../common/time';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { PushDeviceRepository } from './push-device.repository';

/** The signed-in user's phones for reminders: PUT registers or refreshes, DELETE forgets. */
@Controller('user/devices')
@UseGuards(AuthGuard('jwt'))
export class DevicesController {
  constructor(
    private readonly devices: PushDeviceRepository,
    private readonly clock: Clock,
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(
    @Request() req: AuthedRequest,
    @Body() dto: RegisterDeviceDto,
  ): Promise<void> {
    await this.devices.upsert(
      req.user.id,
      dto.token,
      dto.platform,
      this.clock.now(),
    );
  }

  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(
    @Request() req: AuthedRequest,
    @Param('token') token: string,
  ): Promise<void> {
    await this.devices.removeOwn(req.user.id, token);
  }
}
