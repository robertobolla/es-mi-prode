import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('competitions')
export class CompetitionsController {
  constructor(
    private readonly competitionsService: CompetitionsService,
    private readonly prisma: PrismaService,
  ) {}

   @UseGuards(AdminGuard)
  @Post()
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @UseGuards(AdminGuard)
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.competitionsService.duplicate(id);
  }

  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(id);
  }

   @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto) {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitionsService.remove(id);
  }

   // ── TEAM MANAGEMENT ──────────────────────────

  @UseGuards(AdminGuard)
  @Post(':id/teams')
  addTeam(@Param('id') id: string, @Body() body: { teamId: string }) {
    return this.competitionsService.addTeamToCompetition(id, body.teamId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id/teams/:ctId')
  removeTeam(@Param('ctId') ctId: string) {
    return this.competitionsService.removeTeamFromCompetition(ctId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/teams/:ctId')
  updateTeam(@Param('ctId') ctId: string, @Body() body: { groupId?: string | null }) {
    return this.competitionsService.updateCompetitionTeam(ctId, body);
  }

   // ── PHASES ──────────────────────────

  @UseGuards(AdminGuard)
  @Post(':id/generate-matchdays')
  generateMatchdays(@Param('id') id: string, @Body() body: { count: number }) {
    return this.competitionsService.generateMatchdays(id, body.count);
  }

  @UseGuards(AdminGuard)
  @Post(':id/phases')
  addPhase(@Param('id') id: string, @Body() body: { name: string; order: number; openDate: string; closeDate: string }) {
    return this.competitionsService.addPhase(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete(':id/phases/:phaseId')
  removePhase(@Param('phaseId') phaseId: string) {
    return this.competitionsService.removePhase(phaseId);
  }

   // ── GROUPS ──────────────────────────

  @UseGuards(AdminGuard)
  @Post(':id/phases/:phaseId/groups')
  addGroup(@Param('phaseId') phaseId: string, @Body() body: { name: string }) {
    return this.competitionsService.addGroup(phaseId, body.name);
  }

  @UseGuards(AdminGuard)
  @Patch('groups/:groupId')
  updateGroup(@Param('groupId') groupId: string, @Body() body: { name?: string; officialFirstPlaceId?: string | null; officialSecondPlaceId?: string | null }) {
    return this.competitionsService.updateGroup(groupId, body);
  }

  @Get(':id/players')
  getPlayers(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('position') position?: string,
  ) {
    return this.competitionsService.searchPlayers(id, search, position);
  }
}
