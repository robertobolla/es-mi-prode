import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(createTournamentDto: any, userId: string) {
    // Generate an 8-character random share code
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    return this.prisma.$transaction(async (tx) => {
      const pointsSystem = createTournamentDto.pointsSystem || {
        exactMatch: 5,
        correctResult: 3,
      };

      const tournament = await tx.tournament.create({
        data: {
          ...createTournamentDto,
          creatorId: userId,
          shareCode,
          pointsSystem,
        },
      });

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

  async findAvailable(userId: string, filters: any) {
    const { name, isCustom, minPlayers, maxPlayers } = filters;

    // Build the where clause
    const where: any = {
      isPublic: true,
      status: 'OPEN',
      // Exclude tournaments user is already in
      members: {
        none: {
          userId,
        },
      },
    };

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (isCustom !== undefined) {
      where.isCustom = isCustom === 'true' || isCustom === true;
    }

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
    return tournaments.filter((t: any) => {
      const count = t._count.members;
      if (minPlayers && count < parseInt(minPlayers)) return false;
      if (maxPlayers && count > parseInt(maxPlayers)) return false;
      return true;
    });
  }

  async findByUser(userId: string) {
    const memberships = await this.prisma.tournamentMember.findMany({
      where: { userId },
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
        members: {
          include: { user: true },
          orderBy: { totalPoints: 'desc' },
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
