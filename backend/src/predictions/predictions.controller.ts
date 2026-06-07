import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    userId: string;
    email: string;
    isAdmin: boolean;
  };
}

interface MatchPredictionBody {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

interface CustomMatchPredictionBody {
  customMatchId: string;
  homeScore: number;
  awayScore: number;
}

interface GroupPredictionBody {
  groupId: string;
  firstPlaceId: string;
  secondPlaceId: string;
}

interface SaveOutrightPredictionBody {
  competitionId: string;
  mvpId?: string | null;
  topScorerId?: string | null;
  goalkeeperId?: string | null;
}

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('tournament/:id')
  async getTournamentMatches(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.getTournamentMatches(id, userId);
  }

  @Post('match')
  async predictMatch(@Body() body: MatchPredictionBody, @Req() req: AuthenticatedRequest) {
    const { matchId, homeScore, awayScore } = body;
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.createMatchPrediction(userId, matchId, homeScore, awayScore);
  }

  @Post('custom-match')
  async predictCustomMatch(@Body() body: CustomMatchPredictionBody, @Req() req: AuthenticatedRequest) {
    const { customMatchId, homeScore, awayScore } = body;
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.createCustomMatchPrediction(userId, customMatchId, homeScore, awayScore);
  }

  @Post('group')
  async predictGroup(@Body() body: GroupPredictionBody, @Req() req: AuthenticatedRequest) {
    const { groupId, firstPlaceId, secondPlaceId } = body;
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.createGroupPrediction(userId, groupId, firstPlaceId, secondPlaceId);
  }

  @Get('tournament/:id/outrights')
  async getTournamentOutrights(@Param('id') tournamentId: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.getTournamentOutrights(tournamentId, userId);
  }

  @Get('tournament/:id/user/:userId')
  async getUserPredictions(
    @Param('id') tournamentId: string,
    @Param('userId') targetUserId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const requestingUserId = req.user.id;
    if (!requestingUserId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.getUserPredictionsForTournament(tournamentId, targetUserId);
  }

  @Post('outrights')
  async saveOutrightPrediction(@Body() body: SaveOutrightPredictionBody, @Req() req: AuthenticatedRequest) {
    const { competitionId, mvpId, topScorerId, goalkeeperId } = body;
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('Usuario no registrado o sesión inválida');
    }
    return this.predictionsService.saveOutrightPrediction(userId, competitionId, mvpId, topScorerId, goalkeeperId);
  }
}

