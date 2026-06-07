import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateRoundRobinFixtures } from './league-generator.util';

@Injectable()
export class CustomTournamentService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private notificationsService: NotificationsService,
  ) {}

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

  async updateTeam(tournamentId: string, teamId: string, creatorUserId: string, data: {
    name?: string;
    abbreviation?: string;
    logoUrl?: string;
    color?: string;
  }) {
    await this.verifyCreator(tournamentId, creatorUserId);
    return this.prisma.customTeam.update({
      where: { id: teamId },
      data,
    });
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

  async finalizePhase(tournamentId: string, phaseId: string, creatorUserId: string) {
    await this.verifyCreator(tournamentId, creatorUserId);
    
    const phase = await this.prisma.customPhase.findUnique({
      where: { id: phaseId },
      include: { matches: true }
    });

    if (!phase) throw new NotFoundException('Phase not found');
    
    const allFinished = phase.matches.every(m => m.status === 'FINISHED');
    if (!allFinished) {
      throw new ForbiddenException('No se puede finalizar la fecha: aún hay partidos sin resultado');
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (tournament?.format === 'liga') {
      return this.scoringService.calculateMatchdayWinner(tournamentId, phaseId, phase.order, 'custom');
    }

    return { message: 'Fase finalizada (solo los torneos de liga tienen ganadores de fecha)' };
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
    const match = await this.prisma.customMatch.update({
      where: { id: matchId },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: 'FINISHED',
      },
      include: { homeTeam: true, awayTeam: true, phase: true },
    });

    // Trigger scoring after result is set
    await this.scoringService.scoreCustomMatch(matchId, tournamentId);

    return match;
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

  // ── GENERATE LEAGUE FIXTURES ───────────────────────────

  async generateLeagueFixtures(tournamentId: string, creatorUserId: string, matchDate?: Date) {
    await this.verifyCreator(tournamentId, creatorUserId);

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { customTeams: { orderBy: { name: 'asc' } } },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.format !== 'liga') {
      throw new ForbiddenException('Solo se pueden generar fixtures para torneos de liga');
    }
    if (tournament.customTeams.length < 2) {
      throw new ForbiddenException('Se necesitan al menos 2 equipos para generar fixtures');
    }

    // Delete existing phases and matches
    await this.prisma.customMatch.deleteMany({
      where: { phase: { tournamentId } },
    });
    await this.prisma.customPhase.deleteMany({
      where: { tournamentId },
    });

    // Generate fixtures
    const teamIds = tournament.customTeams.map((t) => t.id);
    const fixtures = generateRoundRobinFixtures(teamIds, tournament.roundTrip);

    // Base date for matches: if not provided, default to tomorrow at 20:00
    let baseDate: Date;
    if (matchDate) {
      baseDate = new Date(matchDate);
    } else {
      baseDate = new Date();
      baseDate.setUTCDate(baseDate.getUTCDate() + 1);
      baseDate.setUTCHours(20, 0, 0, 0);
    }

    // Create phases (one per matchday) and matches
    for (const matchday of fixtures) {
      // Each matchday is 7 days apart by default
      const matchdayDate = new Date(baseDate);
      matchdayDate.setUTCDate(matchdayDate.getUTCDate() + (matchday.matchdayNumber - 1) * 7);
      // Ensure it's exactly at the same time as baseDate in UTC
      matchdayDate.setUTCMinutes(0, 0, 0);

      // Predictions close 1 hour before the matchday
      const closeDate = new Date(matchdayDate);
      closeDate.setUTCHours(closeDate.getUTCHours() - 1);

      const phase = await this.prisma.customPhase.create({
        data: {
          tournamentId,
          name: `Fecha ${matchday.matchdayNumber}`,
          type: 'matchday',
          order: matchday.matchdayNumber,
          predictionsCloseAt: closeDate,
          startDate: matchdayDate,
        },
      });

      for (const match of matchday.matches) {
        await this.prisma.customMatch.create({
          data: {
            phaseId: phase.id,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            matchDate: matchdayDate,
          },
        });
      }
    }

    return { matchdays: fixtures.length, matchesPerMatchday: fixtures[0]?.matches.length || 0 };
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
        matchdayWinners: {
          orderBy: { matchdayNumber: 'desc' },
          include: { user: { select: { id: true, username: true } } },
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
