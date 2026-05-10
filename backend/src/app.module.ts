import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { MatchesModule } from './matches/matches.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { TournamentMembersModule } from './tournament-members/tournament-members.module';
import { InvitationsModule } from './invitations/invitations.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RankingsModule } from './rankings/rankings.module';
import { ScoringModule } from './scoring/scoring.module';
import { BadgesModule } from './badges/badges.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PurchasesModule } from './purchases/purchases.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';
import { CronModule } from './cron/cron.module';
import { ChatModule } from './chat/chat.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule, AuthModule, UsersModule, CompetitionsModule, MatchesModule, TournamentsModule, TournamentMembersModule, InvitationsModule, PredictionsModule, RankingsModule, ScoringModule, BadgesModule, NotificationsModule, PurchasesModule, AdminModule, StatsModule, CronModule, ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
