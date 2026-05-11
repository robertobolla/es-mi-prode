import { Injectable } from '@nestjs/common';
import { ScoringService } from '../scoring/scoring.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
  ) {}

  create(createMatchDto: CreateMatchDto) {
    return this.prisma.match.create({ data: createMatchDto as any });
  }

  findAll() {
    return this.prisma.match.findMany();
  }

  findOne(id: string) {
    return this.prisma.match.findUnique({ where: { id } });
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.prisma.match.update({
      where: { id },
      data: updateMatchDto as any,
    });

    // Trigger scoring if match is finished and scores are set
    if (
      match.status === 'FINISHED' &&
      match.homeScore90 !== null &&
      match.awayScore90 !== null
    ) {
      await this.scoringService.scoreOfficialMatch(match.id);
    }

    return match;
  }

  remove(id: string) {
    return this.prisma.match.delete({ where: { id } });
  }
}
