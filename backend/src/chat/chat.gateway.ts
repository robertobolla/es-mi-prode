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

@WebSocketGateway({
  cors: {
    origin: '*', // Allow connections from mobile
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
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
      const message = await this.chatService.saveMessage(
        data.tournamentId,
        data.userId,
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
