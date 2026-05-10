import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron(CronExpression.EVERY_HOUR)
  handleMatchClosures() {
    this.logger.debug('Running cron job to close phases and update matches...');
    // Logic to lock predictions when phase closes
  }

  @Cron('0 0 * * *') // Every midnight
  calculateDailyScores() {
    this.logger.debug('Running cron job to calculate scores and update rankings...');
    // Calls ScoringService and RankingsService
  }
}
