import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface OutrightPlayerInfo {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  flagUrl: string | null;
}

export interface OutrightResult {
  predictMvp: boolean;
  predictTopScorer: boolean;
  predictGoalkeeper: boolean;
  prediction: {
    mvp: OutrightPlayerInfo | null;
    topScorer: OutrightPlayerInfo | null;
    goalkeeper: OutrightPlayerInfo | null;
  } | null;
}

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async getTournamentMatches(tournamentId: string, userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required to fetch predictions');
    }

    console.log(`🔍 [PredictionsService] getTournamentMatches called with userId="${userId}", tournamentId="${tournamentId}"`);

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        competition: {
          include: {
            phases: {
              include: {
                groups: {
                  include: {
                    teams: {
                      include: {
                        team: true
                      }
                    },
                    groupPredictions: {
                      where: { userId }
                    }
                  }
                },
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

    // DEBUG: Log prediction counts per custom match
    tournament.customPhases.forEach(phase => {
      phase.matches.forEach(match => {
        if (match.predictions.length > 0) {
          console.log(`📊 [DEBUG] Phase "${phase.name}" Match ${match.id}: ${match.predictions.length} predictions found. UserIds: ${match.predictions.map(p => p.userId).join(', ')}`);
        }
      });
    });

    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    // Map official phases
    const officialPhases = tournament.competition?.phases.map(p => {
      const hasUpcomingMatches = p.matches.some(m => (new Date(m.matchDate).getTime() - oneHour) > now.getTime() && m.status === 'SCHEDULED');
      const isPhaseOpen = (p.closeDate > now) || hasUpcomingMatches;
      
      return {
        id: p.id,
        name: p.name,
        isOpen: isPhaseOpen,
        groups: p.groups?.map(g => {
          return {
            id: g.id,
            name: g.name,
            teams: g.teams.map(ct => ({
              id: ct.team.id,
              name: ct.team.name,
              flagUrl: ct.team.flagUrl,
            })),
            myPrediction: g.groupPredictions[0] || null,
          };
        }) || [],
        matches: p.matches.map(m => {
          const matchTime = new Date(m.matchDate).getTime();
          return {
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
            closeDate: new Date(matchTime - oneHour).toISOString(),
            groupName: m.group?.name,
            myPrediction: m.predictions[0] || null,
            isCustom: false,
            isOpen: (matchTime - oneHour) > now.getTime() && m.status === 'SCHEDULED' && isPhaseOpen
          };
        })
      };
    }) || [];

    // Map custom phases
    const customPhases = tournament.customPhases.map(p => {
      // A phase is open if its deadline is in the future, OR if it has matches that haven't started yet.
      const hasUpcomingMatches = p.matches.some(m => (new Date(m.matchDate).getTime() - oneHour) > now.getTime() && m.status === 'SCHEDULED');
      const isPhaseOpen = (p.predictionsCloseAt ? new Date(p.predictionsCloseAt) > now : true) || hasUpcomingMatches;
      
      return {
        id: p.id,
        name: p.name,
        isOpen: isPhaseOpen, // This will be the global phase status
        matches: p.matches.map(m => {
          const matchTime = new Date(m.matchDate).getTime();
          const finalCloseDate = new Date(matchTime - oneHour).toISOString();

          return {
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
            closeDate: finalCloseDate,
            groupName: 'General',
            myPrediction: m.predictions[0] || null,
            isCustom: true,
            // Match is open if the phase is open AND the individual match hasn't started yet.
            // If the phase deadline was accidental (e.g. from a previous generation), we'll allow it 
            // if it's still before the match start, PROVIDED the phase doesn't explicitly say it's closed.
            isOpen: (matchTime - oneHour) > now.getTime() && m.status === 'SCHEDULED' && isPhaseOpen
          };
        })
      };
    });

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
    const oneHour = 60 * 60 * 1000;
    const hasMatchStarted = (new Date(match.matchDate).getTime() - oneHour) < now.getTime();

    if (hasMatchStarted || match.status !== 'SCHEDULED') {
      throw new BadRequestException('Predictions are closed for this match (1 hour before start)');
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
    const oneHour = 60 * 60 * 1000;
    const hasMatchStarted = (new Date(match.matchDate).getTime() - oneHour) < now.getTime();

    if (hasMatchStarted || match.status !== 'SCHEDULED') {
      throw new BadRequestException('Predictions are closed for this match (1 hour before start)');
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
    const oneHour = 60 * 60 * 1000;
    
    // For groups, we check if the first match of the phase has already started (minus 1 hour)
    // or if the phase has an explicit closeDate that passed.
    const isPhaseLocked = group.phase.closeDate && group.phase.closeDate < now;
    if (isPhaseLocked) {
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

  async getTournamentOutrights(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        competitionId: true,
        predictMvp: true,
        predictTopScorer: true,
        predictGoalkeeper: true,
      },
    });

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    if (!tournament.competitionId) {
      return {
        competitionId: null,
        predictMvp: false,
        predictTopScorer: false,
        predictGoalkeeper: false,
        prediction: null,
      };
    }

    const prediction = await this.prisma.outrightPrediction.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId: tournament.competitionId,
        },
      },
      include: {
        mvp: { include: { team: true } },
        topScorer: { include: { team: true } },
        goalkeeper: { include: { team: true } },
      },
    });

    return {
      competitionId: tournament.competitionId,
      predictMvp: tournament.predictMvp,
      predictTopScorer: tournament.predictTopScorer,
      predictGoalkeeper: tournament.predictGoalkeeper,
      prediction: prediction ? {
        id: prediction.id,
        mvpId: prediction.mvpId,
        mvp: prediction.mvp ? {
          id: prediction.mvp.id,
          firstName: prediction.mvp.firstName,
          lastName: prediction.mvp.lastName,
          teamName: prediction.mvp.team.name,
          flagUrl: prediction.mvp.team.flagUrl,
        } : null,
        topScorerId: prediction.topScorerId,
        topScorer: prediction.topScorer ? {
          id: prediction.topScorer.id,
          firstName: prediction.topScorer.firstName,
          lastName: prediction.topScorer.lastName,
          teamName: prediction.topScorer.team.name,
          flagUrl: prediction.topScorer.team.flagUrl,
        } : null,
        goalkeeperId: prediction.goalkeeperId,
        goalkeeper: prediction.goalkeeper ? {
          id: prediction.goalkeeper.id,
          firstName: prediction.goalkeeper.firstName,
          lastName: prediction.goalkeeper.lastName,
          teamName: prediction.goalkeeper.team.name,
          flagUrl: prediction.goalkeeper.team.flagUrl,
        } : null,
      } : null,
    };
  }

  async saveOutrightPrediction(
    userId: string,
    competitionId: string,
    mvpId?: string | null,
    topScorerId?: string | null,
    goalkeeperId?: string | null,
  ) {
    const firstPhase = await this.prisma.phase.findFirst({
      where: { competitionId, order: 1 },
    });

    const now = new Date();
    if (firstPhase && firstPhase.closeDate && firstPhase.closeDate < now) {
      throw new BadRequestException('Las predicciones especiales del torneo están cerradas.');
    }

    return this.prisma.outrightPrediction.upsert({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
      update: {
        mvpId: mvpId || null,
        topScorerId: topScorerId || null,
        goalkeeperId: goalkeeperId || null,
      },
      create: {
        userId,
        competitionId,
        mvpId: mvpId || null,
        topScorerId: topScorerId || null,
        goalkeeperId: goalkeeperId || null,
      },
    });
  }

  /**
   * Get another user's predictions for a tournament (read-only view).
   * Only returns predictions for matches that are already locked (1h before start).
   * Points are only shown for FINISHED matches.
   */
  async getUserPredictionsForTournament(tournamentId: string, targetUserId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        competition: {
          include: {
            phases: {
              include: {
                groups: {
                  include: {
                    teams: {
                      include: { team: true },
                    },
                    groupPredictions: {
                      where: { userId: targetUserId },
                    },
                  },
                },
                matches: {
                  include: {
                    homeTeam: { include: { team: true } },
                    awayTeam: { include: { team: true } },
                    group: true,
                    predictions: {
                      where: { userId: targetUserId },
                    },
                  },
                  orderBy: { matchDate: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        customPhases: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
                predictions: {
                  where: { userId: targetUserId },
                },
              },
              orderBy: { matchDate: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    // Helper: check if a match is locked (1h before start)
    const isMatchLocked = (matchDate: Date): boolean => {
      return (new Date(matchDate).getTime() - oneHour) <= now.getTime();
    };

    // Map official phases – only include locked matches with predictions
    const officialPhases = tournament.competition?.phases.map(phase => {
      const isPhaseClosed = phase.closeDate < now;

      // Filter matches: only include locked ones
      const lockedMatches = phase.matches
        .filter(m => isMatchLocked(m.matchDate))
        .map(m => {
          const prediction = m.predictions[0] || null;
          const isFinished = m.status === 'FINISHED';

          return {
            id: m.id,
            homeTeam: {
              name: m.homeTeam?.team.name,
              flagUrl: m.homeTeam?.team.flagUrl,
            },
            awayTeam: {
              name: m.awayTeam?.team.name,
              flagUrl: m.awayTeam?.team.flagUrl,
            },
            matchDate: m.matchDate,
            status: m.status,
            homeScore90: isFinished ? m.homeScore90 : null,
            awayScore90: isFinished ? m.awayScore90 : null,
            groupName: m.group?.name,
            isCustom: false,
            prediction: prediction ? {
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
              points: isFinished ? prediction.points : null,
            } : null,
          };
        });

      // Groups: only show if phase is closed
      const groups = isPhaseClosed ? (phase.groups?.map(g => ({
        id: g.id,
        name: g.name,
        teams: g.teams.map(ct => ({
          id: ct.team.id,
          name: ct.team.name,
          flagUrl: ct.team.flagUrl,
        })),
        officialFirstPlaceId: g.officialFirstPlaceId,
        officialSecondPlaceId: g.officialSecondPlaceId,
        prediction: g.groupPredictions[0] ? {
          firstPlaceId: g.groupPredictions[0].firstPlaceId,
          secondPlaceId: g.groupPredictions[0].secondPlaceId,
        } : null,
      })) || []) : [];

      return {
        id: phase.id,
        name: phase.name,
        matches: lockedMatches,
        groups,
      };
    }) || [];

    // Map custom phases – only include locked matches
    const customPhases = tournament.customPhases.map(phase => {
      const lockedMatches = phase.matches
        .filter(m => isMatchLocked(m.matchDate))
        .map(m => {
          const prediction = m.predictions[0] || null;
          const isFinished = m.status === 'FINISHED';

          return {
            id: m.id,
            homeTeam: {
              name: m.homeTeam?.name,
              flagUrl: m.homeTeam?.logoUrl,
            },
            awayTeam: {
              name: m.awayTeam?.name,
              flagUrl: m.awayTeam?.logoUrl,
            },
            matchDate: m.matchDate,
            status: m.status,
            homeScore: isFinished ? m.homeScore : null,
            awayScore: isFinished ? m.awayScore : null,
            groupName: 'General',
            isCustom: true,
            prediction: prediction ? {
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
              points: isFinished ? prediction.points : null,
            } : null,
          };
        });

      return {
        id: phase.id,
        name: phase.name,
        matches: lockedMatches,
      };
    });

    // Outrights: only visible after 1st phase closeDate
    let outrights: OutrightResult | null = null;
    if (tournament.competition) {
      const firstPhase = tournament.competition.phases.find(p => p.order === 1);
      const outrightsLocked = firstPhase ? firstPhase.closeDate < now : false;

      if (outrightsLocked && (tournament.predictMvp || tournament.predictTopScorer || tournament.predictGoalkeeper)) {
        const outrightPred = await this.prisma.outrightPrediction.findUnique({
          where: {
            userId_competitionId: {
              userId: targetUserId,
              competitionId: tournament.competition.id,
            },
          },
          include: {
            mvp: { include: { team: true } },
            topScorer: { include: { team: true } },
            goalkeeper: { include: { team: true } },
          },
        });

        outrights = {
          predictMvp: tournament.predictMvp,
          predictTopScorer: tournament.predictTopScorer,
          predictGoalkeeper: tournament.predictGoalkeeper,
          prediction: outrightPred ? {
            mvp: outrightPred.mvp ? {
              id: outrightPred.mvp.id,
              firstName: outrightPred.mvp.firstName,
              lastName: outrightPred.mvp.lastName,
              teamName: outrightPred.mvp.team.name,
              flagUrl: outrightPred.mvp.team.flagUrl,
            } : null,
            topScorer: outrightPred.topScorer ? {
              id: outrightPred.topScorer.id,
              firstName: outrightPred.topScorer.firstName,
              lastName: outrightPred.topScorer.lastName,
              teamName: outrightPred.topScorer.team.name,
              flagUrl: outrightPred.topScorer.team.flagUrl,
            } : null,
            goalkeeper: outrightPred.goalkeeper ? {
              id: outrightPred.goalkeeper.id,
              firstName: outrightPred.goalkeeper.firstName,
              lastName: outrightPred.goalkeeper.lastName,
              teamName: outrightPred.goalkeeper.team.name,
              flagUrl: outrightPred.goalkeeper.team.flagUrl,
            } : null,
          } : null,
        };
      }
    }

    return {
      phases: [...officialPhases, ...customPhases],
      outrights,
    };
  }
}