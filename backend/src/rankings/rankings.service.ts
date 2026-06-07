import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GlobalRankingItem {
  id: string;
  competitionId: string;
  userId: string;
  bestTournamentId: string;
  points: number;
  rank: number;
  username: string;
  avatarUrl: string | null;
}

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async getActiveGlobalRanking(supabaseUserId: string) {
    // Find active competition
    const activeCompetition = await this.prisma.competition.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeCompetition) {
      return {
        rankings: [],
        myRanking: null,
        competition: null,
      };
    }

    // Fetch top 100 positions in the global ranking
    const rankings = await this.prisma.globalRanking.findMany({
      where: { competitionId: activeCompetition.id },
      orderBy: { rank: 'asc' },
      take: 100,
    });

    const userIds = rankings.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const rankingsMapped = rankings.map((r) => {
      const user = userMap.get(r.userId);
      return {
        ...r,
        username: user?.username || 'Usuario',
        avatarUrl: user?.avatarUrl || null,
      };
    });

    // Check requesting user ranking
    let myRankingMapped: GlobalRankingItem | null = null;
    if (supabaseUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { supabaseId: supabaseUserId },
        select: { id: true, username: true, avatarUrl: true },
      });

      if (currentUser) {
        const isUserInTop100 = userIds.includes(currentUser.id);
        if (!isUserInTop100) {
          const myRanking = await this.prisma.globalRanking.findUnique({
            where: {
              competitionId_userId: {
                competitionId: activeCompetition.id,
                userId: currentUser.id,
              },
            },
          });

          if (myRanking) {
            myRankingMapped = {
              ...myRanking,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
            };
          }
        }
      }
    }

    return {
      rankings: rankingsMapped,
      myRanking: myRankingMapped,
      competition: {
        id: activeCompetition.id,
        name: activeCompetition.name,
        predictMvp: activeCompetition.predictMvp,
        predictTopScorer: activeCompetition.predictTopScorer,
        predictGoalkeeper: activeCompetition.predictGoalkeeper,
        predictGroups: activeCompetition.predictGroups,
        pointsSystem: activeCompetition.pointsSystem,
      },
    };
  }
}
