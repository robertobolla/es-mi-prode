import { Module } from '@nestjs/common';
import { TournamentMembersController } from './tournament-members.controller';
import { TournamentMembersService } from './tournament-members.service';

@Module({
  controllers: [TournamentMembersController],
  providers: [TournamentMembersService]
})
export class TournamentMembersModule {}
