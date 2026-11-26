import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PlantLedgerModule } from '../plant-ledger';
import { DevicesController } from './devices.controller';
import { buildPushSender } from './fcm-push-sender';
import { PushDeviceRepository } from './push-device.repository';
import { PushSender } from './push-sender';
import { ReminderAudienceRepository } from './reminder-audience.repository';
import { ReminderDispatchService } from './reminder-dispatch.service';
import { ReminderSendsRepository } from './reminder-sends.repository';

/** Garden reminders on the phone: device registration and the morning/evening push run. */
@Module({
  imports: [PlantLedgerModule],
  controllers: [DevicesController],
  providers: [
    PushDeviceRepository,
    ReminderAudienceRepository,
    ReminderSendsRepository,
    ReminderDispatchService,
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
