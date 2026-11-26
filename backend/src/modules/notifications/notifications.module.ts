import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { DevicesController } from './devices.controller';
import { buildPushSender } from './fcm-push-sender';
import { PushDeviceRepository } from './push-device.repository';
import { PushSender } from './push-sender';

/** Garden reminders on the phone: device registration and the morning/evening push run. */
@Module({
  controllers: [DevicesController],
  providers: [
    PushDeviceRepository,
    {
      provide: PushSender,
      inject: [ConfigService, PinoLogger],
      useFactory: (config: ConfigService, logger: PinoLogger) => {
        logger.setContext(PushSender.name);
        return buildPushSender(
          config.get<string>('FCM_SERVICE_ACCOUNT'),
          logger,
        );
      },
    },
  ],
})
export class NotificationsModule {}
