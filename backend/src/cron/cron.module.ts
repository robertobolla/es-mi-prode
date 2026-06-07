import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScoringModule } from '../scoring/scoring.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScoringModule, PrismaModule, NotificationsModule],
  providers: [CronService],
})
export class CronModule {}
