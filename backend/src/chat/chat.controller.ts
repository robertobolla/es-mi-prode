import { Controller, Get, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@Controller('tournaments/:id/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getMessages(@Param('id') tournamentId: string, @Request() req) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new NotFoundException('User not found');

    return this.chatService.getMessages(tournamentId, user.id);
  }
}
