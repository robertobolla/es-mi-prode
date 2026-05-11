import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [activeCompetitions, totalUsers, pendingMatches] = await Promise.all([
      this.prisma.competition.count({
        where: { active: true },
      }),
      this.prisma.user.count(),
      this.prisma.match.count({
        where: { status: 'SCHEDULED' },
      }),
    ]);

    // Fetch last 5 registered users
    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { username: true, createdAt: true },
    });

    // Fetch last 5 tournament joins
    const recentMembers = await this.prisma.tournamentMember.findMany({
      orderBy: { joinedAt: 'desc' },
      take: 5,
      include: {
        user: { select: { username: true } },
        tournament: { select: { name: true } },
      },
    });

    // Combine into a single activity list sorted by date desc
    const activities = [
      ...recentUsers.map((u) => ({
        id: `user-${u.username}-${u.createdAt.getTime()}`,
        type: 'user_registered',
        detail: `Nuevo usuario registrado: @${u.username}`,
        date: u.createdAt,
      })),
      ...recentMembers.map((m) => ({
        id: `join-${m.user.username}-${m.tournament.name}-${m.joinedAt.getTime()}`,
        type: 'tournament_join',
        detail: `El usuario @${m.user.username} se unió al torneo "${m.tournament.name}"`,
        date: m.joinedAt,
      })),
    ];

    // Sort descending by date
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Slice to top 6 activities
    const topActivities = activities.slice(0, 6);

    return {
      activeCompetitions,
      totalUsers,
      pendingMatches,
      recentActivity: topActivities,
    };
  }
}
