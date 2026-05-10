import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomTournamentService } from './custom-tournament.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Controller('tournaments/:tournamentId')
export class CustomTournamentController {
  constructor(
    private readonly customService: CustomTournamentService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserId(req: any): Promise<string> {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new Error('User not found');
    return user.id;
  }

  // ── FULL DETAIL ────────────────────────────────────────

  @Get()
  getFullTournament(@Param('tournamentId') tournamentId: string) {
    return this.customService.getFullTournament(tournamentId);
  }

  // ── TEAMS ──────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('teams')
  async addTeam(
    @Param('tournamentId') tournamentId: string,
    @Request() req,
    @Body() body: { name: string; abbreviation?: string; color?: string; logoUrl?: string },
  ) {
    const userId = await this.getUserId(req);
    return this.customService.addTeam(tournamentId, userId, body);
  }

  @Get('teams')
  getTeams(@Param('tournamentId') tournamentId: string) {
    return this.customService.getTeams(tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('teams/:teamId')
  async removeTeam(
    @Param('tournamentId') tournamentId: string,
    @Param('teamId') teamId: string,
    @Request() req,
  ) {
    const userId = await this.getUserId(req);
    return this.customService.removeTeam(tournamentId, teamId, userId);
  }

  // ── TEAM LOGO UPLOAD ──────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('teams/:teamId/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadTeamLogo(
    @Param('tournamentId') tournamentId: string,
    @Param('teamId') teamId: string,
    @Request() req,
    @UploadedFile() file: any,
  ) {
    const userId = await this.getUserId(req);
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
    );
    
    const fileName = `team-logos/${tournamentId}/${teamId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    
    const { error } = await supabase.storage
      .from('assets')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    
    if (error) throw new Error(`Upload failed: ${error.message}`);
    
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);
    
    return this.prisma.customTeam.update({
      where: { id: teamId },
      data: { logoUrl: urlData.publicUrl },
    });
  }

  // ── PHASES ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('phases')
  async addPhase(
    @Param('tournamentId') tournamentId: string,
    @Request() req,
    @Body() body: {
      name: string;
      type?: string;
      order: number;
      predictionsOpenAt?: string;
      predictionsCloseAt?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const userId = await this.getUserId(req);
    return this.customService.addPhase(tournamentId, userId, {
      ...body,
      predictionsOpenAt: body.predictionsOpenAt ? new Date(body.predictionsOpenAt) : undefined,
      predictionsCloseAt: body.predictionsCloseAt ? new Date(body.predictionsCloseAt) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Get('phases')
  getPhases(@Param('tournamentId') tournamentId: string) {
    return this.customService.getPhases(tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('phases/:phaseId')
  async removePhase(
    @Param('tournamentId') tournamentId: string,
    @Param('phaseId') phaseId: string,
    @Request() req,
  ) {
    const userId = await this.getUserId(req);
    return this.customService.removePhase(tournamentId, phaseId, userId);
  }

  // ── MATCHES ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('matches')
  async addMatch(
    @Param('tournamentId') tournamentId: string,
    @Request() req,
    @Body() body: {
      phaseId: string;
      homeTeamId: string;
      awayTeamId: string;
      matchDate: string;
      location?: string;
    },
  ) {
    const userId = await this.getUserId(req);
    return this.customService.addMatch(tournamentId, userId, {
      ...body,
      matchDate: new Date(body.matchDate),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('matches/:matchId/result')
  async updateMatchResult(
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Request() req,
    @Body() body: { homeScore: number; awayScore: number },
  ) {
    const userId = await this.getUserId(req);
    return this.customService.updateMatchResult(tournamentId, matchId, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('matches/:matchId')
  async removeMatch(
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Request() req,
  ) {
    const userId = await this.getUserId(req);
    return this.customService.removeMatch(tournamentId, matchId, userId);
  }

  // ── AWARDS ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('awards')
  async setAwards(
    @Param('tournamentId') tournamentId: string,
    @Request() req,
    @Body() body: { awardMvp?: string; awardTopScorer?: string; awardGoalkeeper?: string },
  ) {
    const userId = await this.getUserId(req);
    return this.customService.setAwards(tournamentId, userId, body);
  }
}
