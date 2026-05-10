import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(
    private readonly competitionsService: CompetitionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto) {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitionsService.remove(id);
  }

  // ── TEAM MANAGEMENT ──────────────────────────

  @Post(':id/teams')
  addTeam(@Param('id') id: string, @Body() body: { teamId: string }) {
    return this.competitionsService.addTeamToCompetition(id, body.teamId);
  }

  @Delete(':id/teams/:ctId')
  removeTeam(@Param('ctId') ctId: string) {
    return this.competitionsService.removeTeamFromCompetition(ctId);
  }

  @Patch(':id/teams/:ctId')
  updateTeam(@Param('ctId') ctId: string, @Body() body: { groupId?: string | null }) {
    return this.competitionsService.updateCompetitionTeam(ctId, body);
  }

  // ── PHASES ──────────────────────────

  @Post(':id/phases')
  addPhase(@Param('id') id: string, @Body() body: { name: string; order: number; openDate: string; closeDate: string }) {
    return this.competitionsService.addPhase(id, body);
  }

  @Delete(':id/phases/:phaseId')
  removePhase(@Param('phaseId') phaseId: string) {
    return this.competitionsService.removePhase(phaseId);
  }

  // ── GROUPS ──────────────────────────

  @Post(':id/phases/:phaseId/groups')
  addGroup(@Param('phaseId') phaseId: string, @Body() body: { name: string }) {
    return this.competitionsService.addGroup(phaseId, body.name);
  }

  @Patch('groups/:groupId')
  updateGroup(@Param('groupId') groupId: string, @Body() body: { name?: string; officialFirstPlaceId?: string | null; officialSecondPlaceId?: string | null }) {
    return this.competitionsService.updateGroup(groupId, body);
  }
}
