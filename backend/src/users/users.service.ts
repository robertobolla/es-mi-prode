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

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 1. Obtener todos los torneos creados por este usuario para eliminarlos en cascada
    const createdTournaments = await this.prisma.tournament.findMany({
      where: { creatorId: id },
      select: { id: true },
    });
    const tournamentIds = createdTournaments.map(t => t.id);

    await this.prisma.$transaction(async (tx) => {
      // Si el usuario creó torneos, limpiamos todo el contenido de esos torneos primero
      if (tournamentIds.length > 0) {
        // Borrar CustomMatchPrediction de los partidos personalizados de estos torneos
        await tx.customMatchPrediction.deleteMany({
          where: {
            customMatch: {
              phase: {
                tournamentId: { in: tournamentIds },
              },
            },
          },
        });

        // Borrar CustomMatch
        await tx.customMatch.deleteMany({
          where: {
            phase: {
              tournamentId: { in: tournamentIds },
            },
          },
        });

        // Borrar CustomPhase
        await tx.customPhase.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Borrar CustomTeam
        await tx.customTeam.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Borrar ChatMessage de los torneos
        await tx.chatMessage.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Borrar MatchdayWinner de los torneos
        await tx.matchdayWinner.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Borrar UserBadge de los torneos
        await tx.userBadge.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Borrar TournamentMember de los torneos
        await tx.tournamentMember.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });

        // Finalmente, borrar los torneos creados
        await tx.tournament.deleteMany({
          where: { id: { in: tournamentIds } },
        });
      }

      // 2. Limpiar las relaciones directas del usuario
      // MatchPredictions del usuario
      await tx.matchPrediction.deleteMany({ where: { userId: id } });

      // CustomMatchPredictions directas del usuario
      await tx.customMatchPrediction.deleteMany({ where: { userId: id } });

      // GroupPredictions del usuario
      await tx.groupPrediction.deleteMany({ where: { userId: id } });

      // OutrightPredictions del usuario
      await tx.outrightPrediction.deleteMany({ where: { userId: id } });

      // Badges del usuario
      await tx.userBadge.deleteMany({ where: { userId: id } });

      // MatchdayWinner del usuario
      await tx.matchdayWinner.deleteMany({ where: { userId: id } });

      // ChatMessage del usuario
      await tx.chatMessage.deleteMany({ where: { userId: id } });

      // TournamentMember (membresías del usuario en otros torneos)
      await tx.tournamentMember.deleteMany({ where: { userId: id } });

      // Reportes enviados o recibidos
      await tx.userReport.deleteMany({
        where: {
          OR: [
            { reporterId: id },
            { reportedId: id }
          ]
        }
      });

      // 3. Borrar el usuario de la tabla User de PostgreSQL
      await tx.user.delete({ where: { id } });
    });

    // 4. Borrar el usuario de Supabase Auth usando el Admin API de Supabase (service role key)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.supabaseId);
        if (error) {
          console.error('❌ [UsersService.remove] Error borrando usuario de Supabase Auth:', error.message);
        } else {
          console.log(`✅ [UsersService.remove] Usuario ${user.email} eliminado con éxito de Supabase Auth.`);
        }
      } catch (e: any) {
        console.error('❌ [UsersService.remove] Excepción borrando usuario de Supabase Auth:', e.message);
      }
    } else {
      console.warn('⚠️ [UsersService.remove] SUPABASE_SERVICE_ROLE_KEY no configurada. Saltando borrado en Supabase Auth.');
    }

    return { success: true };
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
