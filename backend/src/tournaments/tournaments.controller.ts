import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, Query, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';

interface RequestWithUser {
  user: {
    userId: string;
    email?: string;
  };
}

interface FindAvailableFilters {
  name?: string;
  isCustom?: string | boolean;
  minPlayers?: string;
  maxPlayers?: string;
}

@Controller('tournaments')
export class TournamentsController {
  private readonly logger = new Logger(TournamentsController.name);

  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: RequestWithUser, @Body() createTournamentDto: CreateTournamentDto) {
    this.logger.log(`Create Tournament Request: ${JSON.stringify(createTournamentDto)}`);
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) {
      this.logger.warn(`User not found for Supabase ID: ${req.user.userId}`);
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User found: ${user.email} (isAdmin: ${user.isAdmin})`);

    // Admin users can create tournaments for free
    // Non-admin users need to provide a paymentTransactionId
    if (!user.isAdmin && !createTournamentDto.paymentTransactionId) {
      throw new ForbiddenException('Tournament creation requires payment or admin privileges.');
    }

    const isCustom = !createTournamentDto.competitionId;

    try {
      return await this.tournamentsService.create({
        ...createTournamentDto,
        competitionId: createTournamentDto.competitionId || undefined,
        isCustom,
      }, user.id, user.isAdmin, user.supabaseId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating tournament: ${err.message}`, err.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  async getAvailableTournaments(@Request() req: RequestWithUser, @Query() query: FindAvailableFilters) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) {
      this.logger.warn('getAvailableTournaments: User not found');
      return [];
    }
    this.logger.log(`getAvailableTournaments called by ${user.username} (${user.id}) with query: ${JSON.stringify(query)}`);
    const results = await this.tournamentsService.findAvailable(user.id, query);
    this.logger.log(`getAvailableTournaments returned ${results.length} results: ${results.map((r: { name: string; shareCode: string }) => `"${r.name}" (${r.shareCode})`).join(', ')}`);
    return results;
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyTournaments(@Request() req: RequestWithUser) {
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
  async join(@Request() req: RequestWithUser, @Body() body: { shareCode: string; password?: string }) {
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
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new Error('User not found');
    return this.tournamentsService.remove(id, user.id);
  }
}
