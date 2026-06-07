import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService, PushMessage } from '../notifications/notifications.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  handleMatchClosures() {
    this.logger.debug('Running cron job to close phases and update matches...');
    // Logic to lock predictions when phase closes
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendUpcomingMatchReminders() {
    this.logger.debug('Running cron job to check for upcoming matches that need predictions...');
    const now = new Date();
    const minDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
    const maxDate = new Date(now.getTime() + 120 * 60 * 1000); // +2 hours

    // 1. Official Matches Reminders
    try {
      const officialMatches = await this.prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          matchDate: {
            gte: minDate,
            lt: maxDate,
          },
        },
        include: {
          homeTeam: { include: { team: true } },
          awayTeam: { include: { team: true } },
          phase: {
            include: {
              competition: {
                include: {
                  tournaments: {
                    include: {
                      members: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (officialMatches.length > 0) {
        this.logger.log(`Found ${officialMatches.length} upcoming official matches. Preparing reminders...`);
        const messages: PushMessage[] = [];

        for (const match of officialMatches) {
          const homeName = match.homeTeam?.team.name || 'Local';
          const awayName = match.awayTeam?.team.name || 'Visitante';
          const tournaments = match.phase.competition.tournaments;

          for (const tournament of tournaments) {
            for (const member of tournament.members) {
              const user = member.user;
              // Only notify if notifications are enabled, token exists, and they haven't predicted
              if (user.pushToken && user.notifyMatches) {
                // Check if they predicted this match
                const hasPredicted = await this.prisma.matchPrediction.findUnique({
                  where: {
                    userId_matchId: {
                      userId: user.id,
                      matchId: match.id,
                    },
                  },
                });

                if (!hasPredicted) {
                  messages.push({
                    to: user.pushToken,
                    title: '⚽ ¡Falta poco para el partido!',
                    body: `Aún no cargaste tu pronóstico para ${homeName} vs. ${awayName} en el torneo "${tournament.name}". ¡No te quedes sin puntos!`,
                    data: {
                      type: 'match_reminder',
                      matchId: match.id,
                      tournamentId: tournament.id,
                    },
                    sound: 'default',
                  });
                }
              }
            }
          }
        }

        if (messages.length > 0) {
          this.logger.log(`Sending ${messages.length} official match reminders...`);
          await this.notificationsService.sendExpoPush(messages);
        }
      }
    } catch (e) {
      const err = e as Error;
      this.logger.error(`Error in official match reminders: ${err.message}`);
    }

    // 2. Custom Matches Reminders
    try {
      const customMatches = await this.prisma.customMatch.findMany({
        where: {
          status: 'SCHEDULED',
          matchDate: {
            gte: minDate,
            lt: maxDate,
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          phase: {
            include: {
              tournament: {
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (customMatches.length > 0) {
        this.logger.log(`Found ${customMatches.length} upcoming custom matches. Preparing reminders...`);
        const messages: PushMessage[] = [];

        for (const match of customMatches) {
          const homeName = match.homeTeam?.name || 'Local';
          const awayName = match.awayTeam?.name || 'Visitante';
          const tournament = match.phase.tournament;

          for (const member of tournament.members) {
            const user = member.user;
            if (user.pushToken && user.notifyMatches) {
              const hasPredicted = await this.prisma.customMatchPrediction.findUnique({
                where: {
                  userId_customMatchId: {
                    userId: user.id,
                    customMatchId: match.id,
                  },
                },
              });

              if (!hasPredicted) {
                messages.push({
                  to: user.pushToken,
                  title: '⚽ ¡Falta poco para el partido!',
                  body: `Aún no cargaste tu pronóstico para ${homeName} vs. ${awayName} en el torneo "${tournament.name}". ¡No te quedes sin puntos!`,
                  data: {
                    type: 'custom_match_reminder',
                    customMatchId: match.id,
                    tournamentId: tournament.id,
                  },
                  sound: 'default',
                });
              }
            }
          }
        }

        if (messages.length > 0) {
          this.logger.log(`Sending ${messages.length} custom match reminders...`);
          await this.notificationsService.sendExpoPush(messages);
        }
      }
    } catch (e) {
      const err = e as Error;
      this.logger.error(`Error in custom match reminders: ${err.message}`);
    }
  }

  @Cron('0 0 * * *') // Every midnight
  calculateDailyScores() {
    this.logger.debug('Running cron job to calculate scores and update rankings...');
    // Calls ScoringService and RankingsService
  }

  @Cron('0 0 * * *') // Every midnight
  async sendWorldCupEveReminder() {
    this.logger.debug('Checking if tomorrow is the start of the competition to send reminders...');
    
    // Find active competition specifically named Mundial FIFA2026 or Mundial FIFA 2026
    const activeCompetition = await this.prisma.competition.findFirst({
      where: {
        active: true,
        OR: [
          { name: 'Mundial FIFA2026' },
          { name: 'Mundial FIFA 2026' }
        ]
      },
    });
    if (!activeCompetition) return;

    // Get the first match of the competition
    const firstMatch = await this.prisma.match.findFirst({
      where: {
        phase: {
          competitionId: activeCompetition.id,
        },
      },
      orderBy: {
        matchDate: 'asc',
      },
    });

    if (!firstMatch) return;

    // Check if the first match is tomorrow
    const now = new Date();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const matchDate = new Date(firstMatch.matchDate);

    if (matchDate >= startOfTomorrow && matchDate < endOfTomorrow) {
      this.logger.log(`Competition "${activeCompetition.name}" starts tomorrow (${firstMatch.matchDate}). Sending push notification reminders...`);
      
      // Find all tournaments for the active competition that are still open and have predictGroups enabled
      const tournaments = await this.prisma.tournament.findMany({
        where: {
          competitionId: activeCompetition.id,
          status: 'OPEN',
          predictGroups: true,
        },
        select: {
          id: true,
        },
      });
      const tournamentIds = tournaments.map(t => t.id);

      // Find all members of these tournaments
      const members = await this.prisma.tournamentMember.findMany({
        where: {
          tournamentId: { in: tournamentIds },
          user: { pushToken: { not: null } },
        },
        include: {
          user: {
            select: {
              id: true,
              pushToken: true,
            },
          },
        },
      });

      const messages: PushMessage[] = [];
      const sentUserIds = new Set<string>();

      for (const member of members) {
        if (sentUserIds.has(member.userId)) continue;
        sentUserIds.add(member.userId);

        messages.push({
          to: member.user.pushToken!,
          title: '⚽ Clasificados Mundial 2026',
          body: 'No olvides poner tus predicciones para los Clasificados a la próxima ronda.',
          data: {
            type: 'outrights_reminder',
            tournamentId: member.tournamentId,
          },
          sound: 'default',
        });
      }

      if (messages.length > 0) {
        await this.notificationsService.sendExpoPush(messages);
      }
    }
  }
}
