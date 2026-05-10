import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  providers: [CronService],
})
export class CronModule {}
