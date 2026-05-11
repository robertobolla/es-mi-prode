import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { CustomTournamentController } from './custom-tournament.controller';
import { CustomTournamentService } from './custom-tournament.service';
import { UsersService } from '../users/users.service';
import { ScoringModule } from '../scoring/scoring.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScoringModule, NotificationsModule],
  controllers: [TournamentsController, CustomTournamentController],
  providers: [TournamentsService, CustomTournamentService, UsersService],
})
export class TournamentsModule {}
