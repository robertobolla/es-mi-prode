import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// We use the Expo push notification API directly via fetch
// instead of the SDK to keep dependencies minimal
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send a push notification to a specific user by their ID.
   */
  async sendPushToUser(userId: string, title: string, body: string, data?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, notifyMatches: true },
    });

    if (!user?.pushToken) return;

    await this.sendExpoPush([{
      to: user.pushToken,
      title,
      body,
      data,
      sound: 'default',
    }]);
  }

  /**
   * Send a push notification to all members of a tournament.
   */
  async sendPushToTournamentMembers(tournamentId: string, title: string, body: string, data?: any) {
    const members = await this.prisma.tournamentMember.findMany({
      where: { tournamentId },
      include: {
        user: { select: { pushToken: true, notifyTournaments: true } },
      },
    });

    const messages: PushMessage[] = members
      .filter((m) => m.user.pushToken && m.user.notifyTournaments)
      .map((m) => ({
        to: m.user.pushToken!,
        title,
        body,
        data: { ...data, tournamentId },
        sound: 'default' as const,
      }));

    if (messages.length === 0) return;

    await this.sendExpoPush(messages);
  }

  /**
   * Send matchday winner notification to all tournament members.
   */
  async notifyMatchdayWinner(
    tournamentId: string,
    tournamentName: string,
    matchdayNumber: number,
    winners: { username: string }[],
    bonusEach: number,
  ) {
    const winnerNames = winners.map((w) => w.username).join(' y ');
    const title = `🏆 ¡Ganador de la Fecha ${matchdayNumber}!`;
    const body = winners.length === 1
      ? `${winnerNames} ganó la Fecha ${matchdayNumber} en "${tournamentName}" (+${bonusEach} pts)`
      : `${winnerNames} comparten la Fecha ${matchdayNumber} en "${tournamentName}" (+${bonusEach} pts c/u)`;

    await this.sendPushToTournamentMembers(tournamentId, title, body, {
      type: 'matchday_winner',
      matchdayNumber,
    });
  }

  /**
   * Send push notifications via Expo Push API.
   * Handles batching (Expo allows up to 100 per request).
   */
  async sendExpoPush(messages: PushMessage[]) {
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Expo push error: ${response.status} - ${errorText}`);
        } else {
          this.logger.log(`Push notifications sent: ${batch.length} messages`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to send push notifications: ${error.message}`);
      }
    }
  }
}
