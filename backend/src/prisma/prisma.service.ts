import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { MonitorService } from '../common/monitor';
import {
  monitorPrismaErrorListener,
  monitorPrismaQueryListener,
} from '../common/monitor/monitor.prisma-middleware';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly monitor: MonitorService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('query', monitorPrismaQueryListener(this.monitor));
    this.$on('error', monitorPrismaErrorListener(this.monitor));
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
