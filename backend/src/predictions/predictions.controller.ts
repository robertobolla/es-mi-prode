import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('tournament/:id')
  async getTournamentMatches(@Param('id') id: string, @Req() req: any) {
    return this.predictionsService.getTournamentMatches(id, req.user.id);
  }

  @Post('match')
  async predictMatch(@Body() body: any, @Req() req: any) {
    const { matchId, homeScore, awayScore } = body;
    return this.predictionsService.createMatchPrediction(req.user.id, matchId, homeScore, awayScore);
  }

  @Post('custom-match')
  async predictCustomMatch(@Body() body: any, @Req() req: any) {
    const { customMatchId, homeScore, awayScore } = body;
    return this.predictionsService.createCustomMatchPrediction(req.user.id, customMatchId, homeScore, awayScore);
  }

  @Post('group')
  async predictGroup(@Body() body: any, @Req() req: any) {
    const { groupId, firstPlaceId, secondPlaceId } = body;
    return this.predictionsService.createGroupPrediction(req.user.id, groupId, firstPlaceId, secondPlaceId);
  }
}
