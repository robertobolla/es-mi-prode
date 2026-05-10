import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createTournamentDto: any) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new Error('User not found');

    // Admin users can create tournaments for free
    // Non-admin users will need payment in the future
    if (!user.isAdmin) {
      // TODO: Implement payment verification ($8 fee)
      // For now, block non-admin users
      throw new Error('Tournament creation requires payment. Coming soon!');
    }

    const isCustom = !createTournamentDto.competitionId;

    return this.tournamentsService.create({
      ...createTournamentDto,
      competitionId: createTournamentDto.competitionId || undefined,
      isCustom,
    }, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  async getAvailableTournaments(@Request() req, @Query() query: any) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) return [];
    return this.tournamentsService.findAvailable(user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyTournaments(@Request() req) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) return [];
    return this.tournamentsService.findByUser(user.id);
  }

  @Get()
  findAll() {
    return this.tournamentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async join(@Request() req, @Body() body: { shareCode: string; password?: string }) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new Error('User not found');
    return this.tournamentsService.joinByCode(body.shareCode, user.id, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    return this.tournamentsService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new Error('User not found');
    return this.tournamentsService.remove(id, user.id);
  }
}
