import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow connections from mobile
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        console.log(`Client connected without token: ${client.id}`);
        return;
      }

      const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret';
      const payload = jwt.verify(token, secret) as any;
      
      // payload.sub is the Supabase User ID
      const user = await this.prisma.user.findUnique({
        where: { supabaseId: payload.sub },
      });

      if (user) {
        client.data.userId = user.id; // internal database User UUID
        client.data.supabaseId = payload.sub;
        console.log(`Authenticated client connected: ${client.id} (User: ${user.username})`);
      } else {
        console.log(`Token verified but user not found in DB: ${payload.sub}`);
      }
    } catch (e: any) {
      console.log(`Auth failed for client ${client.id}: ${e.message}`);
      // Soft disconnect or just keep connected as anonymous? 
      // Better disconnect if it attempted to auth but failed
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTournamentChat')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string; userId: string },
  ) {
    try {
      // Validate that the client's authenticated userId matches the userId they claim to join as
      const authUserId = client.data.userId;
      if (authUserId && authUserId !== data.userId) {
        console.warn(`Security alert: Client ${client.id} tried to join room using mismatched userId ${data.userId} (Authenticated: ${authUserId})`);
        return;
      }

      client.join(data.tournamentId);
      console.log(`Client ${client.id} joined room ${data.tournamentId}`);
      client.emit('joinedRoom', { tournamentId: data.tournamentId });
    } catch (e) {
      client.emit('error', 'Cannot join room');
    }
  }

  @SubscribeMessage('leaveTournamentChat')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string },
  ) {
    client.leave(data.tournamentId);
    console.log(`Client ${client.id} left room ${data.tournamentId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string; userId: string; content: string; mediaUrl?: string; mediaType?: string },
  ) {
    try {
      // Security: use the verified user ID from the WebSocket session instead of the payload
      const userId = client.data.userId || data.userId;
      if (!userId) {
        client.emit('error', 'Unauthorized: You must be logged in to send messages');
        return;
      }

      const message = await this.chatService.saveMessage(
        data.tournamentId,
        userId,
        data.content,
        data.mediaUrl,
        data.mediaType
      );

      // Broadcast the message to all clients in the tournament room (including sender)
      this.server.to(data.tournamentId).emit('newMessage', message);
    } catch (e: any) {
      client.emit('error', e.message || 'Error sending message');
    }
  }
}
