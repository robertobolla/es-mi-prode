import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { 
    supabaseId: string; 
    username: string; 
    email: string;
    fullName?: string;
    gender?: string;
    country?: string;
    city?: string;
    state?: string;
    dob?: Date;
  }) {
    // Check if username taken
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    return this.prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        gender: data.gender,
        country: data.country,
        city: data.city,
        state: data.state,
        dob: data.dob,
        isAdmin: data.email === 'bblasivan@gmail.com' || data.email === 'robertobolla9@gmail.com' || data.email === 'testing@esmiprode.com',
      },
    });
  }

  async findBySupabaseId(supabaseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      include: {
        badges: {
          include: {
            tournament: true,
          },
          orderBy: {
            earnedAt: 'desc',
          },
        },
        memberships: {
          include: {
            tournament: {
              include: {
                competition: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
          take: 10, // Fetch the last 10 tournaments
        },
      }
    });

    if (user) {
      const higherPointsCount = await this.prisma.user.count({
        where: {
          historicalPoints: {
            gt: user.historicalPoints,
          },
        },
      });
      (user as any).globalRank = higherPointsCount + 1;
    }

    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async ensureUserJoinedPublicTournament(userId: string): Promise<void> {
    // 1. Find active competition
    const activeCompetition = await this.prisma.competition.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!activeCompetition) return;

    // 2. Find public tournament for this competition
    let publicTournament = await this.prisma.tournament.findFirst({
      where: {
        competitionId: activeCompetition.id,
        isPublic: true,
      },
    });

    // 3. Create public tournament if not exists
    if (!publicTournament) {
      let adminUser = await this.prisma.user.findFirst({
        where: { isAdmin: true },
      });
      if (!adminUser) {
        adminUser = await this.prisma.user.findFirst({
          where: { id: userId },
        });
      }
      const creatorId = adminUser?.id || userId;

      const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      try {
        publicTournament = await this.prisma.tournament.create({
          data: {
            name: `${activeCompetition.name} - Oficial`,
            competitionId: activeCompetition.id,
            creatorId,
            isPublic: true,
            shareCode,
            pointsSystem: {
              exactMatch: 5,
              correctResult: 3,
              matchdayWinner: 3,
              mvp: 10,
              topScorer: 10,
              goalkeeper: 10,
              groupExact: 10,
              groupBoth: 5,
              groupOne: 2,
            },
            format: 'copa',
            status: 'OPEN',
          },
        });
      } catch (error: unknown) {
        const err = error as Error;
        console.error('❌ Error auto-creating public tournament:', err.message);
        return;
      }
    }

    // 4. Join user to public tournament if they aren't already
    try {
      const existingMember = await this.prisma.tournamentMember.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId: publicTournament.id,
            userId,
          },
        },
      });

      if (!existingMember) {
        await this.prisma.tournamentMember.create({
          data: {
            tournamentId: publicTournament.id,
            userId,
          },
        });
        console.log(`✅ Usuario ${userId} unido automáticamente al torneo público ${publicTournament.id}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error auto-joining user to public tournament:', err.message);
    }
  }

  async blockUser(userId: string, blockedId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { blockedUserIds: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const blockedUserIds = user.blockedUserIds || [];
    if (!blockedUserIds.includes(blockedId)) {
      blockedUserIds.push(blockedId);
      await this.prisma.user.update({
        where: { id: userId },
        data: { blockedUserIds }
      });
    }
    return { success: true };
  }

  async reportUser(userId: string, reportedId: string, reason: string) {
    return this.prisma.userReport.create({
      data: {
        reporterId: userId,
        reportedId,
        reason: reason || 'Inappropriate behavior/content'
      }
    });
  }
}
