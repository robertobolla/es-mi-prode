import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface OvertakeEvent {
  tournamentId: string;
  tournamentName: string;
  overtakerUsername: string;
  newRank: number;
}

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

    const overtakeAccumulator = new Map<string, OvertakeEvent[]>();

    // Recalculate member totals for all tournaments using this competition
    const tournaments = match.phase.competition.tournaments;
    for (const tournament of tournaments) {
      await this.recalculateTournamentMembers(tournament.id, overtakeAccumulator);

      // Check if all matches in this phase are finished (for matchday winner)
      if (tournament.format === 'liga') {
        await this.checkAndCalculateMatchdayWinner(tournament.id, match.phaseId, 'official');
      }
    }

    // Send overtakes batch notifications
    await this.processAndSendOvertakeNotifications(overtakeAccumulator);

    // Recalculate global ranking for this competition
    await this.recalculateGlobalRanking(match.phase.competition.id);
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

    const overtakeAccumulator = new Map<string, OvertakeEvent[]>();

    // Recalculate totals
    await this.recalculateTournamentMembers(tournamentId, overtakeAccumulator);

    // Send overtakes batch notifications
    await this.processAndSendOvertakeNotifications(overtakeAccumulator);

    /*
    // Check matchday winner for liga format
    if (tournament.format === 'liga') {
      await this.checkAndCalculateMatchdayWinner(tournamentId, match.phaseId, 'custom');
    }
    */
  }

  // ── CALCULATE POINTS FOR A SINGLE PREDICTION ──────────────
  private calculateMatchPoints(
    predHome: number,
    predAway: number,
    officialHome: number,
    officialAway: number,
    pointsSystem: { exactMatch?: number; exact?: number; correctResult?: number; result?: number },
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
  async recalculateTournamentMembers(tournamentId: string, overtakeAccumulator?: Map<string, OvertakeEvent[]>) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        members: true,
        competition: {
          include: {
            phases: {
              include: {
                matches: { include: { predictions: true } },
                groups: {
                  include: {
                    groupPredictions: true,
                  },
                },
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

    // Store previous rank/points before recalculating
    const previousRanks = new Map<string, { rank: number | null; totalPoints: number }>();
    for (const m of tournament.members) {
      previousRanks.set(m.userId, { rank: m.rank, totalPoints: m.totalPoints });
    }

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

            const useExtraTime = tournament.includeExtraTime && match.homeScore120 !== null && match.awayScore120 !== null;
            const officialHome = useExtraTime ? match.homeScore120! : match.homeScore90;
            const officialAway = useExtraTime ? match.awayScore120! : match.awayScore90;

            if (officialHome !== null && officialAway !== null) {
              const points = this.calculateMatchPoints(
                pred.homeScore,
                pred.awayScore,
                officialHome,
                officialAway,
                pointsSystem,
              );
              totalPoints += points;
              if (points === exactPts) exactResults++;
              else if (points === resultPts) correctResults++;
            }
          }

          // Group predictions points
          if (tournament.predictGroups && phase.groups) {
            for (const group of phase.groups) {
              if (group.officialFirstPlaceId && group.officialSecondPlaceId) {
                const gp = group.groupPredictions.find((g) => g.userId === member.userId);
                if (gp) {
                  const groupExact = pointsSystem.groupExact ?? 10;
                  const groupBoth = pointsSystem.groupBoth ?? 5;
                  const groupOne = pointsSystem.groupOne ?? 2;

                  const predicted = [gp.firstPlaceId, gp.secondPlaceId];
                  const official = [group.officialFirstPlaceId, group.officialSecondPlaceId];

                  if (predicted[0] === official[0] && predicted[1] === official[1]) {
                    totalPoints += groupExact;
                  } else if (predicted.includes(official[0]) && predicted.includes(official[1])) {
                    totalPoints += groupBoth;
                  } else if (predicted.includes(official[0]) || predicted.includes(official[1])) {
                    totalPoints += groupOne;
                  }
                }
              }
            }
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
      include: { user: true },
      orderBy: [{ totalPoints: 'desc' }, { exactResults: 'desc' }],
    });

    const newRankMap = new Map<string, number>();
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const newRank = i + 1;
      newRankMap.set(m.userId, newRank);

      await this.prisma.tournamentMember.update({
        where: { id: m.id },
        data: { rank: newRank },
      });
    }

    // Detect ranking overtakes (exclude official public tournament to avoid spam on huge lists)
    const isOfficialPublic = tournament.isPublic && tournament.name.toLowerCase().includes('oficial');
    
    if (overtakeAccumulator && !isOfficialPublic) {
      for (const m of members) {
        const newRank = newRankMap.get(m.userId);
        const prev = previousRanks.get(m.userId);
        
        if (newRank && prev && prev.rank !== null && newRank > prev.rank) {
          // Find who overtook this member.
          // We look for the member directly ahead of them in the new ranking.
          const directAhead = members.find(other => newRankMap.get(other.userId) === newRank - 1);
          if (directAhead) {
            const directAheadPrev = previousRanks.get(directAhead.userId);
            if (directAheadPrev && directAheadPrev.rank !== null && directAheadPrev.rank > prev.rank) {
              // The directAhead member was previously behind and is now directly ahead.
              if (!overtakeAccumulator.has(m.userId)) {
                overtakeAccumulator.set(m.userId, []);
              }
              overtakeAccumulator.get(m.userId)!.push({
                tournamentId: tournament.id,
                tournamentName: tournament.name,
                overtakerUsername: directAhead.user.username,
                newRank,
              });
            }
          }
        }
      }
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
          include: {
            match: true,
          },
        });
        for (const p of predictions) {
          const useExtraTime = tournament.includeExtraTime && p.match.homeScore120 !== null && p.match.awayScore120 !== null;
          const officialHome = useExtraTime ? p.match.homeScore120! : p.match.homeScore90;
          const officialAway = useExtraTime ? p.match.awayScore120! : p.match.awayScore90;

          if (officialHome !== null && officialAway !== null) {
            const points = this.calculateMatchPoints(
              p.homeScore,
              p.awayScore,
              officialHome,
              officialAway,
              pointsSystem,
            );
            matchdayPoints += points;
            if (points === exactPts) matchdayExacts++;
          }
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

  // ── RECALCULATE GLOBAL RANKINGS ─────────────────────────────
  async recalculateGlobalRanking(competitionId: string) {
    this.logger.log(`Recalculating Global Ranking for competition: ${competitionId}`);

    // 1. Find the official public tournament for this competition
    const publicTournament = await this.prisma.tournament.findFirst({
      where: {
        competitionId,
        isPublic: true,
      },
    });

    if (!publicTournament) {
      this.logger.warn(`No public tournament found for competition: ${competitionId}. Global Ranking cannot be updated.`);
      return;
    }

    // 2. Recalculate member scores for the public tournament to ensure they are up to date
    await this.recalculateTournamentMembers(publicTournament.id);

    // Fetch the updated members ordered by totalPoints desc, then exactResults desc
    const publicTournamentWithMembers = await this.prisma.tournament.findUnique({
      where: { id: publicTournament.id },
      include: {
        members: {
          orderBy: [
            { totalPoints: 'desc' },
            { exactResults: 'desc' },
          ],
        },
      },
    });

    if (!publicTournamentWithMembers) return;

    const publicMemberUserIds = new Set(publicTournamentWithMembers.members.map((m) => m.userId));

    // 3. Remove GlobalRanking entries for users who are no longer in the public tournament
    await this.prisma.globalRanking.deleteMany({
      where: {
        competitionId,
        userId: {
          notIn: Array.from(publicMemberUserIds),
        },
      },
    });

    // 4. Sync each member's points and rank into the GlobalRanking table
    for (let i = 0; i < publicTournamentWithMembers.members.length; i++) {
      const member = publicTournamentWithMembers.members[i];
      const rank = i + 1;

      await this.prisma.globalRanking.upsert({
        where: {
          competitionId_userId: {
            competitionId,
            userId: member.userId,
          },
        },
        update: {
          points: member.totalPoints,
          rank,
          bestTournamentId: publicTournament.id,
        },
        create: {
          competitionId,
          userId: member.userId,
          points: member.totalPoints,
          rank,
          bestTournamentId: publicTournament.id,
        },
      });
    }

    this.logger.log(`Completed Global Ranking for competition: ${competitionId}. Ranked ${publicTournamentWithMembers.members.length} users.`);
  }

  /**
   * Process accumulated ranking overtake events, group them by user,
   * apply a 4-hour cooldown check, and send push notifications.
   */
  private async processAndSendOvertakeNotifications(overtakeAccumulator: Map<string, OvertakeEvent[]>) {
    if (overtakeAccumulator.size === 0) return;
    this.logger.log(`Processing ranking overtake notifications for ${overtakeAccumulator.size} users...`);

    const now = new Date();
    const cooldownMs = 4 * 60 * 60 * 1000; // 4 hours

    for (const [userId, events] of overtakeAccumulator.entries()) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pushToken: true, notifyRanking: true, lastRankNotificationAt: true },
        });

        // Check basic filters
        if (!user || !user.pushToken || !user.notifyRanking) continue;

        // Apply 4-hour cooldown
        if (user.lastRankNotificationAt) {
          const timeSinceLastNotification = now.getTime() - new Date(user.lastRankNotificationAt).getTime();
          if (timeSinceLastNotification < cooldownMs) {
            this.logger.debug(`Skipping overtake notification for user ${userId} due to 4-hour cooldown.`);
            continue;
          }
        }

        let title = '🔥 ¡Te pasaron en el ranking!';
        let body = '';

        if (events.length === 1) {
          body = `¡Te pasaron! @${events[0].overtakerUsername} te superó en el torneo "${events[0].tournamentName}" (puesto #${events[0].newRank}).`;
        } else {
          body = `¡Te pasaron! Te superaron en ${events.length} torneos (incluyendo "${events[0].tournamentName}"). ¡Entrá a recuperar tu puesto!`;
        }

        // Send push notification
        await this.notificationsService.sendExpoPush([{
          to: user.pushToken,
          title,
          body,
          data: {
            type: 'ranking_overtake',
            tournamentsCount: events.length,
            primaryTournamentId: events[0].tournamentId,
          },
          sound: 'default',
        }]);

        // Update notification sent timestamp
        await this.prisma.user.update({
          where: { id: userId },
          data: { lastRankNotificationAt: now },
        });

        this.logger.log(`Sent ranking overtake push to user ${userId} (torneys count: ${events.length}).`);
      } catch (e) {
        const err = e as Error;
        this.logger.error(`Failed to process ranking notification for user ${userId}: ${err.message}`);
      }
    }
  }
}
