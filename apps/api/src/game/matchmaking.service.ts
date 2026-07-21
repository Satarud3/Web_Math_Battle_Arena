import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from './room.service';
import { RedisService } from '../redis/redis.service';
import { Server } from 'socket.io';
import { MatchMode, MatchStatus } from '@prisma/client';

export interface QueueEntry {
  userId: string;
  socketId: string;
  username: string;
  ratingPoint: number;
  joinedAt: string;
  joinedAtMs: number;
  chosenMode: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class MatchmakingService implements OnModuleInit, OnModuleDestroy {
  private scanInterval: NodeJS.Timeout | null = null;
  private server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.startScanning();
  }

  onModuleDestroy() {
    this.stopScanning();
  }

  setServer(server: Server) {
    this.server = server;
  }

  private startScanning() {
    this.scanInterval = setInterval(() => {
      this.scanQueue();
    }, 3000); // scan queue actively every 3 seconds
  }

  private stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
  }

  async joinQueue(player: { userId: string; socketId: string; username: string; chosenMode?: string }) {
    const queue = await this.redisService.lrange<QueueEntry>('mba:matchmaking_queue', 0, -1);
    const exists = queue.some((entry) => entry.userId === player.userId);
    if (exists) return;

    // Fetch MMR/Rating from DB
    const ranking = await this.prisma.ranking.findUnique({
      where: { userId: player.userId },
    });
    const ratingPoint = ranking ? ranking.ratingPoint : 1000;
    const chosenMode = player.chosenMode || 'ARENA';
    const nowMs = Date.now();

    const entry: QueueEntry = {
      userId: player.userId,
      socketId: player.socketId,
      username: player.username,
      ratingPoint,
      joinedAt: new Date(nowMs).toISOString(),
      joinedAtMs: nowMs,
      chosenMode,
    };

    await this.redisService.lpush('mba:matchmaking_queue', entry);

    // Notify player that they successfully joined the queue
    this.server.to(player.socketId).emit('queue_joined', {
      ratingPoint,
      chosenMode,
    });
  }

  async leaveQueue(userId: string) {
    const queue = await this.redisService.lrange<QueueEntry>('mba:matchmaking_queue', 0, -1);
    const entry = queue.find((item) => item.userId === userId);
    if (entry) {
      await this.redisService.lrem('mba:matchmaking_queue', 0, (item) => item.userId === userId);
      this.server.to(entry.socketId).emit('queue_left');
    }
  }

  public async scanQueue() {
    const pair = await this.redisService.popMatchPair<QueueEntry>('mba:matchmaking_queue', Date.now());
    if (pair) {
      const [playerA, playerB] = pair;
      await this.createMatch(playerA, playerB);
      // Recursively scan until no more pairs can be atomically matched
      await this.scanQueue();
    }
  }

  private async createMatch(playerA: QueueEntry, playerB: QueueEntry, isPrivate = false) {
    try {
      // 1. Fetch active questions
      const activeQuestions = await this.prisma.question.findMany({
        where: { isActive: true },
      });

      if (activeQuestions.length === 0) {
        throw new Error('Bank soal kosong, tidak dapat membuat pertandingan.');
      }

      // Determine dynamic question count based on chosenMode
      let questionCount = 20;
      if (playerA.chosenMode === 'MARATHON') {
        questionCount = 50;
      }

      const shuffled = shuffleArray(activeQuestions);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      const questionOrder = selected.map((q) => q.id);

      // 2. Create Match and MatchPlayers atomically
      const match = await this.prisma.$transaction(async (tx) => {
        const newMatch = await tx.match.create({
          data: {
            mode: MatchMode.DUEL,
            status: MatchStatus.ACTIVE,
            totalQuestions: questionOrder.length,
            questionOrder,
            startedAt: new Date(),
          },
        });

        await tx.matchPlayer.create({
          data: {
            matchId: newMatch.id,
            userId: playerA.userId,
            totalScore: 0,
            correctCount: 0,
            wrongCount: 0,
            avgAnswerTime: 0.0,
          },
        });

        await tx.matchPlayer.create({
          data: {
            matchId: newMatch.id,
            userId: playerB.userId,
            totalScore: 0,
            correctCount: 0,
            wrongCount: 0,
            avgAnswerTime: 0.0,
          },
        });

        return newMatch;
      });

      // 3. Setup Socket.IO Room association
      const socketA = this.server.sockets.sockets.get(playerA.socketId);
      const socketB = this.server.sockets.sockets.get(playerB.socketId);

      if (socketA) socketA.join(match.id);
      if (socketB) socketB.join(match.id);

      // 4. Emit match_found to both players, including battleMode
      this.server.to(playerA.socketId).emit('match_found', {
        matchId: match.id,
        battleMode: playerA.chosenMode,
        opponent: {
          userId: playerB.userId,
          username: playerB.username,
          ratingPoint: playerB.ratingPoint,
        },
      });

      this.server.to(playerB.socketId).emit('match_found', {
        matchId: match.id,
        battleMode: playerB.chosenMode,
        opponent: {
          userId: playerA.userId,
          username: playerA.username,
          ratingPoint: playerA.ratingPoint,
        },
      });

      // 5. Initialize active Room
      await this.roomService.createRoom(match.id, playerA, playerB, questionOrder, playerA.chosenMode, isPrivate);
    } catch (err) {
      console.error('Gagal membuat pertandingan 1v1:', err);
      // Put them back in queue or notify failure
      this.server.to(playerA.socketId).emit('match_error', { message: 'Gagal inisialisasi arena' });
      this.server.to(playerB.socketId).emit('match_error', { message: 'Gagal inisialisasi arena' });
    }
  }

  async startPrivateMatch(
    player1: { userId: string; socketId: string; username: string; ratingPoint?: number },
    player2: { userId: string; socketId: string; username: string; ratingPoint?: number },
    mode = 'ARENA',
  ) {
    const nowMs = Date.now();
    const entryA: QueueEntry = {
      userId: player1.userId,
      socketId: player1.socketId,
      username: player1.username,
      ratingPoint: player1.ratingPoint || 1000,
      joinedAt: new Date(nowMs).toISOString(),
      joinedAtMs: nowMs,
      chosenMode: mode,
    };
    const entryB: QueueEntry = {
      userId: player2.userId,
      socketId: player2.socketId,
      username: player2.username,
      ratingPoint: player2.ratingPoint || 1000,
      joinedAt: new Date(nowMs).toISOString(),
      joinedAtMs: nowMs,
      chosenMode: mode,
    };
    await this.createMatch(entryA, entryB, true);
  }
}
