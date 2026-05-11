import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ── SCORE AN OFFICIAL MATCH ────────────────────────────────
  async scoreOfficialMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        phase: { include: { competition: { include: { tournaments: true } } } },
        predictions: true,
      },
    });

    if (!match || match.status !== 'FINISHED' || match.homeScore90 === null || match.awayScore90 === null) {
      return;
    }

    // Score each prediction for this match
    for (const prediction of match.predictions) {
      // Find which tournaments this user belongs to that use this competition
      const tournaments = match.phase.competition.tournaments;
      for (const tournament of tournaments) {
        const member = await this.prisma.tournamentMember.findUnique({
          where: { tournamentId_userId: { tournamentId: tournament.id, userId: prediction.userId } },
        });
        if (!member) continue;

        const pointsSystem = tournament.pointsSystem as any;
        const useExtraTime = tournament.includeExtraTime && match.homeScore120 !== null && match.awayScore120 !== null;
        const officialHome = useExtraTime ? match.homeScore120! : match.homeScore90;
        const officialAway = useExtraTime ? match.awayScore120! : match.awayScore90;

        const points = this.calculateMatchPoints(
          prediction.homeScore,
          prediction.awayScore,
          officialHome,
          officialAway,
          pointsSystem,
        );

        // Update prediction points
        await this.prisma.matchPrediction.update({
          where: { id: prediction.id },
          data: { points },
        });
      }
    }

    // Recalculate member totals for all tournaments using this competition
    const tournaments = match.phase.competition.tournaments;
    for (const tournament of tournaments) {
      await this.recalculateTournamentMembers(tournament.id);

      // Check if all matches in this phase are finished (for matchday winner)
      if (tournament.format === 'liga') {
        await this.checkAndCalculateMatchdayWinner(tournament.id, match.phaseId, 'official');
      }
    }
  }

  // ── SCORE A CUSTOM MATCH ───────────────────────────────────
  async scoreCustomMatch(matchId: string, tournamentId: string) {
    const match = await this.prisma.customMatch.findUnique({
      where: { id: matchId },
      include: {
        phase: true,
        predictions: true,
      },
    });

    if (!match || match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) {
      return;
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) return;

    const pointsSystem = tournament.pointsSystem as any;

    // Score each prediction
    for (const prediction of match.predictions) {
      const member = await this.prisma.tournamentMember.findUnique({
        where: { tournamentId_userId: { tournamentId, userId: prediction.userId } },
      });
      if (!member) continue;

      const points = this.calculateMatchPoints(
        prediction.homeScore,
        prediction.awayScore,
        match.homeScore,
        match.awayScore,
        pointsSystem,
      );

      await this.prisma.customMatchPrediction.update({
        where: { id: prediction.id },
        data: { points },
      });
    }

    // Recalculate totals
    await this.recalculateTournamentMembers(tournamentId);

    // Check matchday winner for liga format
    if (tournament.format === 'liga') {
      await this.checkAndCalculateMatchdayWinner(tournamentId, match.phaseId, 'custom');
    }
  }

  // ── CALCULATE POINTS FOR A SINGLE PREDICTION ──────────────
  private calculateMatchPoints(
    predHome: number,
    predAway: number,
    officialHome: number,
    officialAway: number,
    pointsSystem: any,
  ): number {
    const exactPoints = pointsSystem.exactMatch ?? pointsSystem.exact ?? 5;
    const resultPoints = pointsSystem.correctResult ?? pointsSystem.result ?? 3;

    // Exact match: both scores are identical
    if (predHome === officialHome && predAway === officialAway) {
      return exactPoints;
    }

    // Correct result (1X2): predicted the right outcome
    const predOutcome = Math.sign(predHome - predAway); // 1 = home, 0 = draw, -1 = away
    const officialOutcome = Math.sign(officialHome - officialAway);

    if (predOutcome === officialOutcome) {
      return resultPoints;
    }

    return 0;
  }

  // ── RECALCULATE ALL MEMBER TOTALS IN A TOURNAMENT ──────────
  async recalculateTournamentMembers(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        members: true,
        competition: {
          include: {
            phases: {
              include: {
                matches: { include: { predictions: true } },
              },
            },
          },
        },
        customPhases: {
          include: {
            matches: { include: { predictions: true } },
          },
        },
      },
    });

    if (!tournament) return;

    for (const member of tournament.members) {
      let totalPoints = 0;
      let exactResults = 0;
      let correctResults = 0;

      const pointsSystem = tournament.pointsSystem as any;
      const exactPts = pointsSystem.exactMatch ?? pointsSystem.exact ?? 5;
      const resultPts = pointsSystem.correctResult ?? pointsSystem.result ?? 3;

      // Official match predictions
      if (tournament.competition) {
        for (const phase of tournament.competition.phases) {
          for (const match of phase.matches) {
            if (match.status !== 'FINISHED') continue;
            const pred = match.predictions.find((p) => p.userId === member.userId);
            if (!pred) continue;

            totalPoints += pred.points;
            if (pred.points === exactPts) exactResults++;
            else if (pred.points === resultPts) correctResults++;
          }
        }
      }

      // Custom match predictions
      for (const phase of tournament.customPhases) {
        for (const match of phase.matches) {
          if (match.status !== 'FINISHED') continue;
          const pred = match.predictions.find((p) => p.userId === member.userId);
          if (!pred) continue;

          totalPoints += pred.points;
          if (pred.points === exactPts) exactResults++;
          else if (pred.points === resultPts) correctResults++;
        }
      }

      // Add matchday winner bonus points
      const bonusPoints = await this.prisma.matchdayWinner.aggregate({
        where: { tournamentId, userId: member.userId },
        _sum: { bonusPoints: true },
      });
      totalPoints += bonusPoints._sum.bonusPoints || 0;

      await this.prisma.tournamentMember.update({
        where: { id: member.id },
        data: { totalPoints, exactResults, correctResults },
      });
    }

    // Update ranks
    const members = await this.prisma.tournamentMember.findMany({
      where: { tournamentId },
      orderBy: [{ totalPoints: 'desc' }, { exactResults: 'desc' }],
    });

    for (let i = 0; i < members.length; i++) {
      await this.prisma.tournamentMember.update({
        where: { id: members[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  // ── CHECK IF ALL MATCHES IN A MATCHDAY ARE FINISHED ────────
  private async checkAndCalculateMatchdayWinner(
    tournamentId: string,
    phaseId: string,
    type: 'official' | 'custom',
  ) {
    let allFinished = false;
    let matchdayOrder = 0;

    if (type === 'custom') {
      const phase = await this.prisma.customPhase.findUnique({
        where: { id: phaseId },
        include: { matches: true },
      });
      if (!phase || phase.matches.length === 0) return;
      allFinished = phase.matches.every((m) => m.status === 'FINISHED');
      matchdayOrder = phase.order;
    } else {
      const phase = await this.prisma.phase.findUnique({
        where: { id: phaseId },
        include: { matches: true },
      });
      if (!phase || phase.matches.length === 0) return;
      allFinished = phase.matches.every((m) => m.status === 'FINISHED');
      matchdayOrder = phase.order;
    }

    if (!allFinished) return;

    // Check if winner already calculated for this matchday
    const existing = await this.prisma.matchdayWinner.findFirst({
      where: { tournamentId, matchdayNumber: matchdayOrder },
    });
    if (existing) return;

    await this.calculateMatchdayWinner(tournamentId, phaseId, matchdayOrder, type);
  }

  // ── CALCULATE MATCHDAY WINNER ──────────────────────────────
  async calculateMatchdayWinner(
    tournamentId: string,
    phaseId: string,
    matchdayNumber: number,
    type: 'official' | 'custom',
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { members: { include: { user: true } } },
    });
    if (!tournament) return;

    const pointsSystem = tournament.pointsSystem as any;
    const bonusPerWinner = pointsSystem.matchdayWinner ?? 3;

    // Calculate each member's points and exacts for this specific matchday
    const memberScores: { userId: string; points: number; exacts: number; username: string }[] = [];

    const exactPts = pointsSystem.exactMatch ?? pointsSystem.exact ?? 5;

    for (const member of tournament.members) {
      let matchdayPoints = 0;
      let matchdayExacts = 0;

      if (type === 'custom') {
        const predictions = await this.prisma.customMatchPrediction.findMany({
          where: {
            userId: member.userId,
            customMatch: { phaseId },
          },
        });
        for (const p of predictions) {
          matchdayPoints += p.points;
          if (p.points === exactPts) matchdayExacts++;
        }
      } else {
        const predictions = await this.prisma.matchPrediction.findMany({
          where: {
            userId: member.userId,
            match: { phaseId },
          },
        });
        for (const p of predictions) {
          matchdayPoints += p.points;
          if (p.points === exactPts) matchdayExacts++;
        }
      }

      memberScores.push({
        userId: member.userId,
        points: matchdayPoints,
        exacts: matchdayExacts,
        username: member.user.username,
      });
    }

    if (memberScores.length === 0) return;

    // Sort by points desc, then exacts desc
    memberScores.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.exacts - a.exacts;
    });

    // Find winners (all with same top score and exacts)
    const topScore = memberScores[0];
    const winners = memberScores.filter(
      (m) => m.points === topScore.points && m.exacts === topScore.exacts,
    );

    // Divide bonus points among winners (floor division)
    const bonusEach = Math.floor(bonusPerWinner / winners.length);

    // Create MatchdayWinner records
    for (const winner of winners) {
      await this.prisma.matchdayWinner.create({
        data: {
          tournamentId,
          ...(type === 'custom' ? { customPhaseId: phaseId } : { phaseId }),
          userId: winner.userId,
          matchdayNumber,
          bonusPoints: bonusEach,
        },
      });

      // Increment matchdayWins counter
      await this.prisma.tournamentMember.update({
        where: {
          tournamentId_userId: { tournamentId, userId: winner.userId },
        },
        data: {
          matchdayWins: { increment: 1 },
          totalPoints: { increment: bonusEach },
        },
      });
    }

    // Re-rank after bonus
    await this.recalculateRanks(tournamentId);

    this.logger.log(
      `Matchday ${matchdayNumber} winner(s) in tournament ${tournamentId}: ${winners.map((w) => w.username).join(', ')} (+${bonusEach} pts each)`,
    );

    // Send push notification
    await this.notificationsService.notifyMatchdayWinner(
      tournamentId,
      tournament.name,
      matchdayNumber,
      winners,
      bonusEach,
    );

    return { winners, bonusEach, matchdayNumber, tournamentName: tournament.name };
  }

  // ── RECALCULATE RANKS ONLY ─────────────────────────────────
  private async recalculateRanks(tournamentId: string) {
    const members = await this.prisma.tournamentMember.findMany({
      where: { tournamentId },
      orderBy: [{ totalPoints: 'desc' }, { exactResults: 'desc' }],
    });

    for (let i = 0; i < members.length; i++) {
      await this.prisma.tournamentMember.update({
        where: { id: members[i].id },
        data: { rank: i + 1 },
      });
    }
  }
}
