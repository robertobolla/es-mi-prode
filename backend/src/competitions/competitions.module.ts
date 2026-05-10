import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { TeamsController } from './teams.controller';

@Module({
  controllers: [CompetitionsController, TeamsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
