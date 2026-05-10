import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async getTournamentMatches(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        competition: {
          include: {
            phases: {
              include: {
                matches: {
                  include: {
                    homeTeam: { include: { team: true } },
                    awayTeam: { include: { team: true } },
                    group: true,
                    predictions: {
                      where: { userId }
                    }
                  },
                  orderBy: { matchDate: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        customPhases: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
                predictions: {
                  where: { userId }
                }
              },
              orderBy: { matchDate: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    const now = new Date();

    // Map official phases
    const officialPhases = tournament.competition?.phases.map(p => ({
      id: p.id,
      name: p.name,
      isOpen: p.closeDate > now,
      matches: p.matches.map(m => ({
        id: m.id,
        homeTeam: {
          name: m.homeTeam?.team.name,
          flagUrl: m.homeTeam?.team.flagUrl
        },
        awayTeam: {
          name: m.awayTeam?.team.name,
          flagUrl: m.awayTeam?.team.flagUrl
        },
        matchDate: m.matchDate,
        status: m.status,
        homeScore90: m.homeScore90,
        awayScore90: m.awayScore90,
        closeDate: p.closeDate,
        groupName: m.group?.name,
        myPrediction: m.predictions[0] || null,
        isCustom: false
      }))
    })) || [];

    // Map custom phases
    const customPhases = tournament.customPhases.map(p => ({
      id: p.id,
      name: p.name,
      isOpen: p.predictionsCloseAt ? p.predictionsCloseAt > now : true,
      matches: p.matches.map(m => ({
        id: m.id,
        homeTeam: {
          name: m.homeTeam?.name,
          flagUrl: m.homeTeam?.logoUrl
        },
        awayTeam: {
          name: m.awayTeam?.name,
          flagUrl: m.awayTeam?.logoUrl
        },
        matchDate: m.matchDate,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        closeDate: p.predictionsCloseAt,
        groupName: 'General',
        myPrediction: m.predictions[0] || null,
        isCustom: true
      }))
    }));

    return [...officialPhases, ...customPhases];
  }

  async createMatchPrediction(userId: string, matchId: string, homeScore: number, awayScore: number) {
    // Check if match exists and is not finished
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { phase: true }
    });

    if (!match) {
      throw new BadRequestException('Match not found');
    }

    // Check if predictions are closed for this phase
    const now = new Date();
    if (match.phase.closeDate < now) {
      throw new BadRequestException('Predictions are closed for this match');
    }

    return this.prisma.matchPrediction.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      },
      update: {
        homeScore,
        awayScore
      },
      create: {
        userId,
        matchId,
        homeScore,
        awayScore
      }
    });
  }

  async createCustomMatchPrediction(userId: string, customMatchId: string, homeScore: number, awayScore: number) {
    const match = await this.prisma.customMatch.findUnique({
      where: { id: customMatchId },
      include: { phase: true }
    });

    if (!match) {
      throw new BadRequestException('Custom match not found');
    }

    const now = new Date();
    if (match.phase.predictionsCloseAt && match.phase.predictionsCloseAt < now) {
      throw new BadRequestException('Predictions are closed for this match');
    }

    return this.prisma.customMatchPrediction.upsert({
      where: {
        userId_customMatchId: {
          userId,
          customMatchId
        }
      },
      update: {
        homeScore,
        awayScore
      },
      create: {
        userId,
        customMatchId,
        homeScore,
        awayScore
      }
    });
  }

  async createGroupPrediction(userId: string, groupId: string, firstPlaceId: string, secondPlaceId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { phase: true }
    });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    const now = new Date();
    if (group.phase.closeDate < now) {
      throw new BadRequestException('Predictions are closed for this group');
    }

    return this.prisma.groupPrediction.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      },
      update: {
        firstPlaceId,
        secondPlaceId
      },
      create: {
        userId,
        groupId,
        firstPlaceId,
        secondPlaceId
      }
    });
  }
}