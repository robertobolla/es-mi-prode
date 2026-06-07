import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Prisma } from '@prisma/client';

interface FindAvailableFilters {
  name?: string;
  isCustom?: string | boolean;
  minPlayers?: string;
  maxPlayers?: string;
}

interface PointsSystem {
  exactMatch?: number | null;
  correctResult?: number | null;
  matchdayWinner?: number | null;
  mvp?: number | null;
  topScorer?: number | null;
  goalkeeper?: number | null;
  groupExact?: number | null;
  groupBoth?: number | null;
  groupOne?: number | null;
  [key: string]: number | null | undefined;
}

interface RevenueCatTransaction {
  id: string;
  purchase_date: string;
  store: string;
}

interface RevenueCatSubscriber {
  non_subscriptions: Record<string, RevenueCatTransaction[]>;
}

interface RevenueCatResponse {
  subscriber: RevenueCatSubscriber;
}

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto & { isCustom?: boolean }, userId: string, isAdmin: boolean, supabaseUserId: string) {
    if (!isAdmin) {
      const transactionId = createTournamentDto.paymentTransactionId;
      if (!transactionId) {
        throw new BadRequestException('La creación de torneo requiere pago.');
      }
      await this.verifyRevenueCatTransaction(supabaseUserId, transactionId);
    }

    // Generate an 8-character random share code
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    this.logger.log(`Starting tournament creation for user ${userId} with shareCode ${shareCode}`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Double check used transactionId
        if (createTournamentDto.paymentTransactionId) {
          const existing = await tx.tournament.findUnique({
            where: { paymentTransactionId: createTournamentDto.paymentTransactionId },
          });
          if (existing) {
            throw new BadRequestException('Este recibo de pago ya fue utilizado para crear otro torneo.');
          }
        }

        const pointsSystem: PointsSystem = (createTournamentDto.pointsSystem as PointsSystem) || {
          exactMatch: 5,
          correctResult: 3,
          matchdayWinner: createTournamentDto.format === 'liga' ? 3 : null,
          mvp: 10,
          topScorer: 10,
          goalkeeper: 10,
          groupExact: 10,
          groupBoth: 5,
          groupOne: 2,
        };

        // Ensure no undefined values are passed to Prisma Json field
        Object.keys(pointsSystem).forEach(key => {
          if (pointsSystem[key] === undefined) pointsSystem[key] = null;
        });

        const data = {
          ...createTournamentDto,
          format: createTournamentDto.format || 'copa',
          roundTrip: createTournamentDto.roundTrip || false,
          predictGroups: createTournamentDto.format === 'liga' ? false : createTournamentDto.predictGroups ?? true,
          includeExtraTime: createTournamentDto.format === 'liga' ? false : createTournamentDto.includeExtraTime ?? false,
          competitionId: createTournamentDto.competitionId || null,
          creatorId: userId,
          shareCode,
          pointsSystem,
          paymentTransactionId: createTournamentDto.paymentTransactionId || null,
        };

        this.logger.log(`Prisma data: ${JSON.stringify(data)}`);

        const tournament = await tx.tournament.create({
          data,
        });

        this.logger.log(`Tournament created: ${tournament.id}`);

        if (createTournamentDto.creatorParticipates !== false) {
          await tx.tournamentMember.create({
            data: {
              tournamentId: tournament.id,
              userId,
            },
          });
        }

        return tournament;
      });
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === 'P2002') {
        // Unique constraint violation (e.g., shareCode collision)
        // Retry once or throw a clear error
        throw new BadRequestException('Error al generar el código del torneo. Por favor, reintente.');
      }
      throw error;
    }
  }

  async verifyRevenueCatTransaction(supabaseUserId: string, transactionId: string) {
    const apiKey = process.env.REVENUECAT_API_KEY;
    if (!apiKey) {
      this.logger.warn('REVENUECAT_API_KEY is not configured. Skipping verification (Dev Mode).');
      return true;
    }

    try {
      const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${supabaseUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`RevenueCat error response status: ${response.status}`);
        throw new BadRequestException('Error al verificar el recibo con RevenueCat.');
      }

      const data = (await response.json()) as RevenueCatResponse;
      const subscriber = data?.subscriber;

      const nonSubscriptions = subscriber?.non_subscriptions || {};
      const productTransactions = nonSubscriptions['com.esmi.prode.crear_torneo'] || [];

      const transactionExists = productTransactions.some(
        (t: RevenueCatTransaction) => t.id === transactionId
      );

      if (!transactionExists) {
        this.logger.warn(`Transaction ID ${transactionId} not found in user ${supabaseUserId} non-subscriptions.`);
        throw new BadRequestException('El código de transacción de pago no es válido para este usuario.');
      }

      return true;
    } catch (e) {
      const err = e as Error;
      this.logger.error(`Error verifying with RevenueCat: ${err.message}`, err.stack);
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('No se pudo verificar el pago con la App Store.');
    }
  }

  async joinByCode(shareCode: string, userId: string, password?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { shareCode },
      include: { _count: { select: { members: true } } },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    if (!tournament.isPublic && tournament.password !== password) {
      throw new BadRequestException('Invalid password');
    }
    if (tournament.maxParticipants && tournament._count.members >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    try {
      return await this.prisma.tournamentMember.create({
        data: { tournamentId: tournament.id, userId },
      });
    } catch(e) {
      throw new BadRequestException('User already joined this tournament');
    }
  }

  findAll() {
    return this.prisma.tournament.findMany({ include: { creator: true, _count: { select: { members: true } } } });
  }

  async findAvailable(userId: string, filters: FindAvailableFilters) {
    const { name, isCustom, minPlayers, maxPlayers } = filters;

    // Build the where clause
    const where: Prisma.TournamentWhereInput = {
      status: 'OPEN',
      // Exclude tournaments user is already in
      members: {
        none: {
          userId,
        },
      },
      ...(name ? {
        OR: [
          {
            name: {
              contains: name.trim(),
              mode: 'insensitive',
            },
          },
          {
            shareCode: name.trim().toUpperCase(),
          },
        ],
      } : {}),
      ...(isCustom !== undefined ? {
        isCustom: isCustom === 'true' || isCustom === true,
      } : {}),
    };

    // Since we need to filter by member count, we might have to do it after the initial fetch
    // or use a more complex raw query if performance is an issue.
    // Given the small size of the app currently, post-filtering or a subquery is fine.
    
    const tournaments = await this.prisma.tournament.findMany({
      where,
      include: {
        creator: true,
        competition: true,
        _count: {
          select: { members: true },
        },
      },
    });

    // Post-filter by player count if specified
    return tournaments.filter((t) => {
      const count = t._count.members;
      if (minPlayers && count < parseInt(minPlayers)) return false;
      if (maxPlayers && count > parseInt(maxPlayers)) return false;
      return true;
    });
  }

  async findByUser(userId: string) {
    const memberships = await this.prisma.tournamentMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: {
        tournament: {
          include: {
            competition: true,
            creator: true,
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map(m => ({
      ...m.tournament,
      memberCount: m.tournament._count.members,
      myPoints: m.totalPoints,
      myRank: m.rank,
    }));
  }

  async findOne(id: string) {
    return this.prisma.tournament.findUnique({
      where: { id },
      include: {
        competition: true,
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
          include: { user: true },
          orderBy: { totalPoints: 'desc' },
        },
        matchdayWinners: {
          orderBy: { matchdayNumber: 'desc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
  }

  findByCode(shareCode: string) {
    return this.prisma.tournament.findUnique({
      where: { shareCode },
      include: {
        competition: true,
        _count: { select: { members: true } }
      }
    });
  }

  async remove(id: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.creatorId !== userId) {
      // Check if admin
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin) throw new BadRequestException('Solo el creador puede eliminar este torneo');
    }

    // Cascade delete related records
    await this.prisma.tournamentMember.deleteMany({ where: { tournamentId: id } });
    await this.prisma.customMatch.deleteMany({ where: { phase: { tournamentId: id } } });
    await this.prisma.customPhase.deleteMany({ where: { tournamentId: id } });
    await this.prisma.customTeam.deleteMany({ where: { tournamentId: id } });
    return this.prisma.tournament.delete({ where: { id } });
  }
}
