import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomTournamentService {
  constructor(private prisma: PrismaService) {}

  // ── TEAMS ──────────────────────────────────────────────

  async addTeam(tournamentId: string, creatorUserId: string, data: {
    name: string;
    abbreviation?: string;
    logoUrl?: string;
    color?: string;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customTeam.create({
      data: { tournamentId, ...data },
    });
  }

  async getTeams(tournamentId: string) {
    return this.prisma.customTeam.findMany({
      where: { tournamentId },
      orderBy: { name: 'asc' },
    });
  }

  async removeTeam(tournamentId: string, teamId: string, creatorUserId: string) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customTeam.delete({ where: { id: teamId } });
  }

  // ── PHASES ─────────────────────────────────────────────

  async addPhase(tournamentId: string, creatorUserId: string, data: {
    name: string;
    type?: string;
    order: number;
    predictionsOpenAt?: Date;
    predictionsCloseAt?: Date;
    startDate?: Date;
    endDate?: Date;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customPhase.create({
      data: { tournamentId, ...data },
    });
  }

  async getPhases(tournamentId: string) {
    return this.prisma.customPhase.findMany({
      where: { tournamentId },
      orderBy: { order: 'asc' },
      include: {
        matches: {
          include: { homeTeam: true, awayTeam: true },
          orderBy: { matchDate: 'asc' },
        },
      },
    });
  }

  async removePhase(tournamentId: string, phaseId: string, creatorUserId: string) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customPhase.delete({ where: { id: phaseId } });
  }

  // ── MATCHES ────────────────────────────────────────────

  async addMatch(tournamentId: string, creatorUserId: string, data: {
    phaseId: string;
    homeTeamId: string;
    awayTeamId: string;
    matchDate: Date;
    location?: string;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customMatch.create({
      data,
      include: { homeTeam: true, awayTeam: true, phase: true },
    });
  }

  async updateMatchResult(tournamentId: string, matchId: string, creatorUserId: string, data: {
    homeScore: number;
    awayScore: number;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customMatch.update({
      where: { id: matchId },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: 'FINISHED',
      },
      include: { homeTeam: true, awayTeam: true, phase: true },
    });
  }

  async removeMatch(tournamentId: string, matchId: string, creatorUserId: string) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customMatch.delete({ where: { id: matchId } });
  }

  // ── AWARDS ─────────────────────────────────────────────

  async setAwards(tournamentId: string, creatorUserId: string, data: {
    awardMvp?: string;
    awardTopScorer?: string;
    awardGoalkeeper?: string;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.tournament.update({
      where: { id: tournamentId },
      data,
    });
  }

  // ── FULL TOURNAMENT DETAIL ─────────────────────────────

  async getFullTournament(tournamentId: string) {
    return this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        customTeams: { orderBy: { name: 'asc' } },
        customPhases: {
          orderBy: { order: 'asc' },
          include: {
            matches: {
              include: { homeTeam: true, awayTeam: true },
              orderBy: { matchDate: 'asc' },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          orderBy: { totalPoints: 'desc' },
        },
        _count: { select: { members: true } },
      },
    });
  }

  // ── HELPERS ────────────────────────────────────────────

  private async verifyCreator(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { creatorId: true },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.creatorId !== userId) {
      throw new ForbiddenException('Only the tournament creator can manage this');
    }
  }
}
