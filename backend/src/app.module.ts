import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { MonitorModule } from './common/monitor';
import { PlantLedgerModule } from './modules/plant-ledger/plant-ledger.module';
import { SeasonalModule } from './modules/seasonal/seasonal.module';
import { VisionModule } from './modules/vision/vision.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { MediaModule } from './modules/media/media.module';
import { CommunityModule } from './modules/community/community.module';
import { ChatModule } from './modules/chat/chat.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PlantsModule } from './modules/plants/plants.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    MonitorModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    PlantLedgerModule,
    SeasonalModule,
    VisionModule,
    DiagnosisModule,
    MediaModule,
    CommunityModule,
    ChatModule,
    SubscriptionModule,
    MarketplaceModule,
    PlantsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
