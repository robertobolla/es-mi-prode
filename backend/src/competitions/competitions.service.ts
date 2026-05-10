import { Injectable } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  create(createCompetitionDto: CreateCompetitionDto) {
    return this.prisma.competition.create({ data: createCompetitionDto as any });
  }

  findAll() {
    return this.prisma.competition.findMany({
      include: {
        phases: { include: { groups: true, matches: true }, orderBy: { order: 'asc' } },
        teams: { include: { team: true, group: true } },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.competition.findUnique({
      where: { id },
      include: {
        phases: { include: { groups: true, matches: true }, orderBy: { order: 'asc' } },
        teams: { include: { team: true, group: true } },
      },
    });
  }

  update(id: string, updateCompetitionDto: UpdateCompetitionDto) {
    return this.prisma.competition.update({ where: { id }, data: updateCompetitionDto as any });
  }

  remove(id: string) {
    return this.prisma.competition.delete({ where: { id } });
  }

  // ── TEAM MANAGEMENT ──────────────────────────

  addTeamToCompetition(competitionId: string, teamId: string) {
    return this.prisma.competitionTeam.create({
      data: { competitionId, teamId },
      include: { team: true },
    });
  }

  removeTeamFromCompetition(ctId: string) {
    return this.prisma.competitionTeam.delete({ where: { id: ctId } });
  }

  updateCompetitionTeam(ctId: string, data: { groupId?: string | null }) {
    return this.prisma.competitionTeam.update({
      where: { id: ctId },
      data,
    });
  }

  // ── PHASE MANAGEMENT ──────────────────────────

  addPhase(competitionId: string, data: { name: string; order: number; openDate: string; closeDate: string }) {
    return this.prisma.phase.create({
      data: {
        competitionId,
        name: data.name,
        order: data.order,
        openDate: new Date(data.openDate),
        closeDate: new Date(data.closeDate),
      },
    });
  }

  removePhase(phaseId: string) {
    return this.prisma.phase.delete({ where: { id: phaseId } });
  }

  // ── GROUP MANAGEMENT ──────────────────────────

  addGroup(phaseId: string, name: string) {
    return this.prisma.group.create({
      data: { phaseId, name },
    });
  }

  updateGroup(groupId: string, data: { name?: string; officialFirstPlaceId?: string | null; officialSecondPlaceId?: string | null }) {
    return this.prisma.group.update({
      where: { id: groupId },
      data,
    });
  }
}
