import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { redisConnection } from './common/redis/redis-connection';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { MonitorModule } from './common/monitor';
import { PlantLedgerModule } from './modules/plant-ledger/plant-ledger.module';
import { SeasonalModule } from './modules/seasonal/seasonal.module';
import { CropsModule } from './modules/crops/crops.module';
import { RegionsModule } from './modules/regions';
import { VisionModule } from './modules/vision/vision.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { MediaModule } from './modules/media/media.module';
import { CommunityModule } from './modules/community/community.module';
import { ChatModule } from './modules/chat/chat.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PlantsModule } from './modules/plants/plants.module';
import { UserModule } from './modules/user/user.module';
import { validateEnv } from './config/env.validation';
import { LoggingModule } from './common/logging/logging.module';
import { ObservabilityModule } from './common/observability';
import { ClockModule } from './common/time';
import { RateLimitModule } from './common/rate-limit';
import { HealthModule } from './common/health/health.module';
import { TransactionModule } from './common/prisma/transaction';
import { AuditModule } from './modules/audit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: redisConnection(configService),
      }),
    }),
    LoggingModule,
    ObservabilityModule,
    ClockModule,
    RateLimitModule,
    HealthModule,
    TransactionModule,
    AuditModule,
    MonitorModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    PlantLedgerModule,
    SeasonalModule,
    CropsModule,
    RegionsModule,
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
