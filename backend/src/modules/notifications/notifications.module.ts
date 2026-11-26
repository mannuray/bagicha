import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { PushDeviceRepository } from './push-device.repository';

/** Garden reminders on the phone: device registration and the morning/evening push run. */
@Module({
  controllers: [DevicesController],
  providers: [PushDeviceRepository],
})
export class NotificationsModule {}
