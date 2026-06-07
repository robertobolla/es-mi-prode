import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('global')
  async getGlobalRanking(@Request() req) {
    return this.rankingsService.getActiveGlobalRanking(req.user.userId);
  }
}
