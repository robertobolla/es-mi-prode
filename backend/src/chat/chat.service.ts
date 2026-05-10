import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(tournamentId: string, userId: string) {
    // Check membership
    const member = await this.prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } }
    });
    if (!member) {
      throw new ForbiddenException('Not a member');
    }

    return this.prisma.chatMessage.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, fullName: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Fetch the last 100 messages initially
    });
  }

  async saveMessage(tournamentId: string, userId: string, content: string, mediaUrl?: string, mediaType?: string) {
    // Check membership
    const member = await this.prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } }
    });
    if (!member) {
      throw new ForbiddenException('Not a member');
    }

    return this.prisma.chatMessage.create({
      data: { tournamentId, userId, content, mediaUrl, mediaType },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, fullName: true } }
      }
    });
  }
}
