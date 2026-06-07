import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { TeamsController } from './teams.controller';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [CompetitionsController, TeamsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
