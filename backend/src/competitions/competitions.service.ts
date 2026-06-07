import { Injectable } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Phase } from '@prisma/client';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class CompetitionsService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
  ) {}

  create(createCompetitionDto: CreateCompetitionDto) {
    const data: Prisma.CompetitionCreateInput = {
      name: createCompetitionDto.name,
      format: createCompetitionDto.format,
      officialMvpId: createCompetitionDto.officialMvpId,
      officialTopScorerId: createCompetitionDto.officialTopScorerId,
      officialGoalkeeperId: createCompetitionDto.officialGoalkeeperId,
      predictMvp: createCompetitionDto.predictMvp,
      predictTopScorer: createCompetitionDto.predictTopScorer,
      predictGoalkeeper: createCompetitionDto.predictGoalkeeper,
      predictGroups: createCompetitionDto.predictGroups,
      pointsSystem: createCompetitionDto.pointsSystem as Prisma.InputJsonValue | undefined,
    };
    return this.prisma.competition.create({ data });
  }

  findAll() {
    return this.prisma.competition.findMany({
      include: {
        phases: { include: { groups: true, matches: true }, orderBy: { order: 'asc' } },
        teams: { include: { team: true, group: true } },
      },
    });
  }

  async findOne(id: string) {
    const comp = await this.prisma.competition.findUnique({
      where: { id },
      include: {
        phases: { include: { groups: true, matches: true }, orderBy: { order: 'asc' } },
        teams: { include: { team: true, group: true } },
      },
    });

    if (!comp) return null;

    const officialMvp = comp.officialMvpId
      ? await this.prisma.player.findUnique({
          where: { id: comp.officialMvpId },
          include: { team: true },
        })
      : null;

    const officialTopScorer = comp.officialTopScorerId
      ? await this.prisma.player.findUnique({
          where: { id: comp.officialTopScorerId },
          include: { team: true },
        })
      : null;

    const officialGoalkeeper = comp.officialGoalkeeperId
      ? await this.prisma.player.findUnique({
          where: { id: comp.officialGoalkeeperId },
          include: { team: true },
        })
      : null;

    return {
      ...comp,
      officialMvp: officialMvp ? {
        id: officialMvp.id,
        name: `${officialMvp.firstName} ${officialMvp.lastName}`,
        teamName: officialMvp.team.name,
      } : null,
      officialTopScorer: officialTopScorer ? {
        id: officialTopScorer.id,
        name: `${officialTopScorer.firstName} ${officialTopScorer.lastName}`,
        teamName: officialTopScorer.team.name,
      } : null,
      officialGoalkeeper: officialGoalkeeper ? {
        id: officialGoalkeeper.id,
        name: `${officialGoalkeeper.firstName} ${officialGoalkeeper.lastName}`,
        teamName: officialGoalkeeper.team.name,
      } : null,
    };
  }

  update(id: string, updateCompetitionDto: UpdateCompetitionDto) {
    const data: Prisma.CompetitionUpdateInput = {
      name: updateCompetitionDto.name,
      format: updateCompetitionDto.format,
      officialMvpId: updateCompetitionDto.officialMvpId,
      officialTopScorerId: updateCompetitionDto.officialTopScorerId,
      officialGoalkeeperId: updateCompetitionDto.officialGoalkeeperId,
      predictMvp: updateCompetitionDto.predictMvp,
      predictTopScorer: updateCompetitionDto.predictTopScorer,
      predictGoalkeeper: updateCompetitionDto.predictGoalkeeper,
      predictGroups: updateCompetitionDto.predictGroups,
      pointsSystem: updateCompetitionDto.pointsSystem as Prisma.InputJsonValue | undefined,
    };
    return this.prisma.competition.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Soft-disconnect tournaments from this competition
      await tx.tournament.updateMany({
        where: { competitionId: id },
        data: { competitionId: null },
      });

      // 2. Delete outright predictions
      await tx.outrightPrediction.deleteMany({
        where: { competitionId: id },
      });

      // 3. Delete global rankings
      await tx.globalRanking.deleteMany({
        where: { competitionId: id },
      });

      // 4. Find all phases
      const phases = await tx.phase.findMany({
        where: { competitionId: id },
        select: { id: true },
      });
      const phaseIds = phases.map(p => p.id);

      if (phaseIds.length > 0) {
        // Find all matches in these phases
        const matches = await tx.match.findMany({
          where: { phaseId: { in: phaseIds } },
          select: { id: true },
        });
        const matchIds = matches.map(m => m.id);

        if (matchIds.length > 0) {
          // Delete match predictions
          await tx.matchPrediction.deleteMany({
            where: { matchId: { in: matchIds } },
          });
        }

        // Delete matches
        await tx.match.deleteMany({
          where: { phaseId: { in: phaseIds } },
        });

        // Find all groups in these phases
        const groups = await tx.group.findMany({
          where: { phaseId: { in: phaseIds } },
          select: { id: true },
        });
        const groupIds = groups.map(g => g.id);

        if (groupIds.length > 0) {
          // Delete group predictions
          await tx.groupPrediction.deleteMany({
            where: { groupId: { in: groupIds } },
          });
        }

        // Delete groups
        await tx.group.deleteMany({
          where: { phaseId: { in: phaseIds } },
        });

        // Delete matchday winners
        await tx.matchdayWinner.deleteMany({
          where: { phaseId: { in: phaseIds } },
        });
      }

      // Delete phases
      await tx.phase.deleteMany({
        where: { competitionId: id },
      });

      // Delete competition teams
      await tx.competitionTeam.deleteMany({
        where: { competitionId: id },
      });

      // Finally delete competition
      return tx.competition.delete({
        where: { id },
      });
    });
  }

  async duplicate(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch the competition with all its details
      const sourceComp = await tx.competition.findUnique({
        where: { id },
        include: {
          phases: {
            include: {
              groups: true,
              matches: true,
            },
          },
          teams: true,
        },
      });

      if (!sourceComp) {
        throw new Error('Competition not found');
      }

      // 2. Create the duplicated competition
      const dupComp = await tx.competition.create({
        data: {
          name: `${sourceComp.name} (Copia)`,
          format: sourceComp.format,
          active: false, // Start as inactive by default
        },
      });

      // 3. Map group IDs and team IDs to replicate relations
      const groupIdMap = new Map<string, string>();
      const teamIdMap = new Map<string, string>(); // maps old teamId -> new CompetitionTeam.id

      // 4. Duplicate teams
      for (const ct of sourceComp.teams) {
        const newCt = await tx.competitionTeam.create({
          data: {
            competitionId: dupComp.id,
            teamId: ct.teamId,
          },
        });
        teamIdMap.set(ct.teamId, newCt.id);
      }

      // 5. Duplicate phases, groups, and matches
      for (const phase of sourceComp.phases) {
        const newPhase = await tx.phase.create({
          data: {
            competitionId: dupComp.id,
            name: phase.name,
            order: phase.order,
            openDate: phase.openDate,
            closeDate: phase.closeDate,
          },
        });

        // Duplicate groups in this phase
        for (const group of phase.groups) {
          const newGroup = await tx.group.create({
            data: {
              phaseId: newPhase.id,
              name: group.name,
            },
          });
          groupIdMap.set(group.id, newGroup.id);
        }

        // Duplicate matches in this phase
        for (const match of phase.matches) {
          let newHomeTeamId: string | null = null;
          let newAwayTeamId: string | null = null;

          if (match.homeTeamId) {
            const oldCt = sourceComp.teams.find(t => t.id === match.homeTeamId);
            if (oldCt) {
              newHomeTeamId = teamIdMap.get(oldCt.teamId) || null;
            }
          }

          if (match.awayTeamId) {
            const oldCt = sourceComp.teams.find(t => t.id === match.awayTeamId);
            if (oldCt) {
              newAwayTeamId = teamIdMap.get(oldCt.teamId) || null;
            }
          }

          await tx.match.create({
            data: {
              phaseId: newPhase.id,
              groupId: match.groupId ? (groupIdMap.get(match.groupId) || null) : null,
              homeTeamId: newHomeTeamId,
              awayTeamId: newAwayTeamId,
              matchDate: match.matchDate,
              status: 'SCHEDULED',
            },
          });
        }
      }

      // 6. Connect teams to their duplicated groups
      for (const ct of sourceComp.teams) {
        if (ct.groupId) {
          const newGroupId = groupIdMap.get(ct.groupId);
          const newCtId = teamIdMap.get(ct.teamId);
          if (newGroupId && newCtId) {
            await tx.competitionTeam.update({
              where: { id: newCtId },
              data: { groupId: newGroupId },
            });
          }
        }
      }

      return dupComp;
    });
  }

  // ── TEAM MANAGEMENT ──────────────────────────

  addTeamToCompetition(competitionId: string, teamId: string) {
    return this.prisma.competitionTeam.create({
      data: { competitionId, teamId },
      include: { team: true },
    });
  }

  removeTeamFromCompetition(ctId: string) {
    return this.prisma.competitionTeam.delete({ where: { id: ctId } });
  }

  updateCompetitionTeam(ctId: string, data: { groupId?: string | null }) {
    return this.prisma.competitionTeam.update({
      where: { id: ctId },
      data,
    });
  }

  // ── PHASE MANAGEMENT ──────────────────────────

  async generateMatchdays(competitionId: string, count: number) {
    const phases: Phase[] = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
      // Create some default spacing (e.g. 7 days apart)
      const openDate = new Date(now);
      openDate.setDate(now.getDate() + (i - 1) * 7);
      const closeDate = new Date(openDate);
      closeDate.setDate(openDate.getDate() + 6);

      const phase = await this.prisma.phase.create({
        data: {
          competitionId,
          name: `Fecha ${i}`,
          order: i,
          openDate,
          closeDate,
        },
      });
      phases.push(phase);
    }
    return phases;
  }

  addPhase(competitionId: string, data: { name: string; order: number; openDate: string; closeDate: string }) {
    return this.prisma.phase.create({
      data: {
        competitionId,
        name: data.name,
        order: data.order,
        openDate: new Date(data.openDate),
        closeDate: new Date(data.closeDate),
      },
    });
  }

  removePhase(phaseId: string) {
    return this.prisma.phase.delete({ where: { id: phaseId } });
  }

  // ── GROUP MANAGEMENT ──────────────────────────

  addGroup(phaseId: string, name: string) {
    return this.prisma.group.create({
      data: { phaseId, name },
    });
  }

  async updateGroup(groupId: string, data: { name?: string; officialFirstPlaceId?: string | null; officialSecondPlaceId?: string | null }) {
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data,
      include: {
        phase: {
          include: {
            competition: {
              include: {
                tournaments: true
              }
            }
          }
        }
      }
    });

    if (group.phase?.competition?.tournaments) {
      for (const tournament of group.phase.competition.tournaments) {
        await this.scoringService.recalculateTournamentMembers(tournament.id);
      }
    }

    return group;
  }

  async searchPlayers(competitionId: string, search?: string, position?: string) {
    const compTeams = await this.prisma.competitionTeam.findMany({
      where: { competitionId },
      select: { teamId: true },
    });
    const teamIds = compTeams.map(ct => ct.teamId);

    const whereClause: Prisma.PlayerWhereInput = {
      teamId: { in: teamIds },
    };

    if (position) {
      whereClause.position = position;
    }

    if (search) {
      const searchLower = search.trim();
      whereClause.OR = [
        { firstName: { contains: searchLower, mode: 'insensitive' } },
        { lastName: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const players = await this.prisma.player.findMany({
      where: whereClause,
      include: {
        team: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      take: 50,
    });

    return players.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      teamId: p.teamId,
      teamName: p.team.name,
      flagUrl: p.team.flagUrl,
    }));
  }
}
