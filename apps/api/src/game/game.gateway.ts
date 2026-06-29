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

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => MatchmakingService))
    private readonly matchmakingService: MatchmakingService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  afterInit(server: Server) {
    console.log('[Socket.IO] GameGateway Initialized');
    this.roomService.setServer(server);
    this.matchmakingService.setServer(server);
  }

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      console.log(`[Socket.IO] Connection rejected: No cookie header`);
      client.disconnect();
      return;
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies['access_token'];
    if (!token) {
      console.log(`[Socket.IO] Connection rejected: access_token cookie not found`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      // Attach user details to socket instance
      client.data.user = {
        id: payload.sub || payload.id, // handle both sub or id payload structures
        username: payload.username,
        role: payload.role,
      };
      console.log(`[Socket.IO] Player connected: @${payload.username} (${client.id})`);

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

  handleDisconnect(client: Socket) {
    if (client.data && client.data.user) {
      const user = client.data.user;
      console.log(`[Socket.IO] Player disconnected: @${user.username} (${client.id})`);
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
