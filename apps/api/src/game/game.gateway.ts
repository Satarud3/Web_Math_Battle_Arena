import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MatchmakingService } from './matchmaking.service';
import { RoomService } from './room.service';
import * as cookie from 'cookie';
import { Inject, forwardRef } from '@nestjs/common';
import { getTier } from '../common/utils/tier';
import { PrismaService } from '../prisma/prisma.service';

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  public static instance: GameGateway;
  public static userStatus = new Map<string, 'ONLINE' | 'OFFLINE' | 'IN_GAME'>();
  public static userSockets = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchmakingService))
    private readonly matchmakingService: MatchmakingService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  afterInit(server: Server) {
    GameGateway.instance = this;
    console.log('[Socket.IO] GameGateway Initialized');
    this.roomService.setServer(server);
    this.matchmakingService.setServer(server);

    // Register callbacks to avoid circular dependencies
    this.roomService.onPlayerStatusChange = async (userId, status) => {
      try {
        GameGateway.userStatus.set(userId, status);
        await this.broadcastStatusToFriends(userId, status);
      } catch (err) {
        console.error(`[GameGateway] Gagal memproses perubahan status untuk ${userId}:`, err);
      }
    };

    this.roomService.checkIsPlayerConnected = (userId) => {
      return GameGateway.userSockets.has(userId);
    };
  }

  async handleConnection(client: Socket) {
    // Extract token from auth handshake, Authorization header, or cookie
    let token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    if (!token && client.handshake.headers?.cookie) {
      const cookies = cookie.parse(client.handshake.headers.cookie);
      token = cookies['access_token'];
    }

    if (!token) {
      console.log(`[Socket.IO] Connection rejected: Token not found`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;

      // Attach user details to socket instance
      client.data.user = {
        id: userId,
        username: payload.username,
        role: payload.role,
      };
      console.log(`[Socket.IO] Player connected: @${payload.username} (${client.id})`);

      // Set user status to ONLINE
      GameGateway.userStatus.set(userId, 'ONLINE');
      GameGateway.userSockets.set(userId, client.id);

      // Broadcast status change to friends
      await this.broadcastStatusToFriends(userId, 'ONLINE');

      // Check if user has an active match running in RoomService
      // and reconnect them automatically
      const activeMatchId = this.findActiveMatchIdByUserId(client.data.user.id);
      if (activeMatchId) {
        const room = this.roomService.getRoom(activeMatchId);
        if (room) {
          console.log(`[Socket.IO] Player @${client.data.user.username} reconnected to active match ${activeMatchId}`);
          room.players[client.data.user.id].socketId = client.id;
          client.join(activeMatchId);

          // Emit current game state back to player so they can resume
          const questionId = room.questionOrder[room.currentQuestionIndex];
          const question = room.questions.get(questionId);

          if (question) {
            const endTime = room.questionStartTime + 15000;
            const scores: Record<string, number> = {};
            const playersInfo: Record<string, any> = {};
            for (const [uid, p] of Object.entries(room.players)) {
              scores[uid] = p.totalScore;
              playersInfo[uid] = {
                username: p.username,
                score: p.totalScore,
                hasAnswered: p.submittedAnswerThisQuestion,
              };
            }

            const playerState = room.players[client.data.user.id];

            client.emit('reconnect_state', {
              matchId: room.matchId,
              currentQuestionNumber: room.currentQuestionIndex + 1,
              totalQuestions: room.questionOrder.length,
              questionId: question.id,
              questionText: question.questionText,
              options: question.options,
              endTime,
              scores,
              playersInfo,
              hasAnswered: playerState ? playerState.submittedAnswerThisQuestion : false,
              chosenOption: playerState ? playerState.chosenOption : undefined,
            });
          }
        }
      }
    } catch (err) {
      console.log(`[Socket.IO] Connection rejected: Invalid JWT token`, err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data && client.data.user) {
      const user = client.data.user;
      console.log(`[Socket.IO] Player disconnected: @${user.username} (${client.id})`);

      // Set user status to OFFLINE
      GameGateway.userStatus.set(user.id, 'OFFLINE');
      GameGateway.userSockets.delete(user.id);

      // Broadcast status change to friends
      await this.broadcastStatusToFriends(user.id, 'OFFLINE');

      this.matchmakingService.leaveQueue(user.id);

      // Handle active match disconnect with 5s grace period
      const activeMatchId = this.findActiveMatchIdByUserId(user.id);
      if (activeMatchId) {
        setTimeout(() => {
          const room = this.roomService.getRoom(activeMatchId);
          if (
            room &&
            room.players[user.id] &&
            room.players[user.id].socketId === client.id
          ) {
            console.log(`[Socket.IO] Grace period expired. Player @${user.username} forfeit match ${activeMatchId}`);
            this.roomService.handlePlayerLeave(activeMatchId, user.id);
          }
        }, 5000);
      }
    }
  }

  async broadcastStatusToFriends(userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME') {
    try {
      const friendships = await this.prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      });

      const friendIds = friendships.map(f => f.senderId === userId ? f.receiverId : f.senderId);

      for (const friendId of friendIds) {
        const friendSocketId = GameGateway.userSockets.get(friendId);
        if (friendSocketId) {
          this.server.to(friendSocketId).emit('friend_status_change', {
            userId,
            status,
          });
        }
      }
    } catch (err) {
      console.error(`Gagal memancarkan status teman untuk user ${userId}:`, err);
    }
  }

  @SubscribeMessage('join_arena')
  async handleJoinArena(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string },
  ) {
    if (!client.data || !client.data.user || !payload || !payload.matchId) return;
    const user = client.data.user;
    const matchId = payload.matchId;

    console.log(
      `[Socket.IO] Player @${user.username} joined arena for match ${matchId} (Socket: ${client.id})`,
    );

    const room = this.roomService.getRoom(matchId);
    if (room && room.players[user.id]) {
      // Update socketId and join socket room
      room.players[user.id].socketId = client.id;
      client.join(matchId);

      // Emit current game state back to player
      const questionId = room.questionOrder[room.currentQuestionIndex];
      const question = room.questions.get(questionId);

      if (question) {
        const duration = room.battleMode === 'LIGHTNING' ? 10000 : room.battleMode === 'MARATHON' ? 35000 : room.battleMode === 'STRATEGY' ? 45000 : 15000;
        const endTime = room.endTime || (room.questionStartTime + duration);
        const scores: Record<string, number> = {};
        const playersInfo: Record<string, any> = {};
        for (const [uid, p] of Object.entries(room.players)) {
          scores[uid] = p.totalScore;
          playersInfo[uid] = {
            username: p.username,
            score: p.totalScore,
            hasAnswered: p.submittedAnswerThisQuestion,
            ratingPoint: p.ratingPoint || 1000,
            tier: getTier(p.ratingPoint || 1000),
          };
        }

        const playerState = room.players[user.id];

        client.emit('reconnect_state', {
          matchId: room.matchId,
          battleMode: room.battleMode,
          currentQuestionNumber: room.currentQuestionIndex + 1,
          totalQuestions: room.questionOrder.length,
          questionId: question.id,
          questionText: question.questionText,
          type: question.type,
          questionData: question.questionData,
          options: question.options,
          endTime,
          scores,
          playersInfo,
          hasAnswered: playerState ? playerState.submittedAnswerThisQuestion : false,
          chosenOption: playerState ? playerState.chosenOption : undefined,
        });
      }
    }
  }

  @SubscribeMessage('join_queue')
  handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { chosenMode?: string },
  ) {
    if (!client.data || !client.data.user) return;
    const user = client.data.user;
    const chosenMode = payload?.chosenMode || 'ARENA';
    console.log(`[Socket.IO] Player @${user.username} requested join_queue with mode ${chosenMode}`);
    this.matchmakingService.joinQueue({
      userId: user.id,
      socketId: client.id,
      username: user.username,
      chosenMode,
    });
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    if (!client.data || !client.data.user) return;
    const user = client.data.user;
    console.log(`[Socket.IO] Player @${user.username} requested leave_queue`);
    this.matchmakingService.leaveQueue(user.id);
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string; chosenOption: string },
  ) {
    if (!client.data || !client.data.user || !payload || !payload.matchId) return;
    const user = client.data.user;
    console.log(
      `[Socket.IO] Player @${user.username} submitted option ${payload.chosenOption} for match ${payload.matchId}`,
    );
    await this.roomService.submitAnswer(payload.matchId, user.id, payload.chosenOption);
  }

  private findActiveMatchIdByUserId(userId: string): string | null {
    // Helper to find match ID by querying all map values in roomService
    const roomsMap = (this.roomService as any).rooms as Map<string, any>;
    if (!roomsMap) return null;
    
    for (const [matchId, room] of roomsMap.entries()) {
      if (room.players && room.players[userId]) {
        return matchId;
      }
    }
    return null;
  }
}
