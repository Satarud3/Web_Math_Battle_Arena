import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from './room.service';
import { Server } from 'socket.io';
import { MatchMode, MatchStatus } from '@prisma/client';

export interface QueueEntry {
  userId: string;
  socketId: string;
  username: string;
  ratingPoint: number;
  joinedAt: Date;
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
  private queue: QueueEntry[] = [];
  private scanInterval: NodeJS.Timeout | null = null;
  private server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
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
    // Check if player is already waiting
    const exists = this.queue.some((entry) => entry.userId === player.userId);
    if (exists) return;

    // Fetch MMR/Rating from DB
    const ranking = await this.prisma.ranking.findUnique({
      where: { userId: player.userId },
    });
    const ratingPoint = ranking ? ranking.ratingPoint : 1000;
    const chosenMode = player.chosenMode || 'ARENA';

    const entry: QueueEntry = {
      userId: player.userId,
      socketId: player.socketId,
      username: player.username,
      ratingPoint,
      joinedAt: new Date(),
      chosenMode,
    };

    this.queue.push(entry);

    // Notify player that they successfully joined the queue
    this.server.to(player.socketId).emit('queue_joined', {
      ratingPoint,
      chosenMode,
    });
  }

  leaveQueue(userId: string) {
    const index = this.queue.findIndex((entry) => entry.userId === userId);
    if (index !== -1) {
      const entry = this.queue[index];
      this.queue.splice(index, 1);
      this.server.to(entry.socketId).emit('queue_left');
    }
  }

  private async scanQueue() {
    if (this.queue.length < 2) return;

    // We will scan the queue starting with the players who have been waiting the longest
    // Sort queue by joinedAt ascending
    this.queue.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    for (let i = 0; i < this.queue.length; i++) {
      const playerA = this.queue[i];
      const elapsedSecsA = (Date.now() - playerA.joinedAt.getTime()) / 1000;
      // MMR tolerance scales dynamically: base 300 + 15 points per second waited
      const toleranceA = 300 + Math.floor(elapsedSecsA * 15);

      for (let j = i + 1; j < this.queue.length; j++) {
        const playerB = this.queue[j];

        // Matchmaking must match players in the SAME mode
        if (playerA.chosenMode !== playerB.chosenMode) continue;

        const elapsedSecsB = (Date.now() - playerB.joinedAt.getTime()) / 1000;
        const toleranceB = 300 + Math.floor(elapsedSecsB * 15);

        const ratingDiff = Math.abs(playerA.ratingPoint - playerB.ratingPoint);
        const maxAllowedTolerance = Math.max(toleranceA, toleranceB);

        if (ratingDiff <= maxAllowedTolerance) {
          // Matched!
          // Remove from queue
          this.queue = this.queue.filter(
            (entry) => entry.userId !== playerA.userId && entry.userId !== playerB.userId,
          );

          // Trigger match creation
          await this.createMatch(playerA, playerB);

          // Reset loop index since we modified the queue
          return this.scanQueue();
        }
      }
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
    const entryA: QueueEntry = {
      userId: player1.userId,
      socketId: player1.socketId,
      username: player1.username,
      ratingPoint: player1.ratingPoint || 1000,
      joinedAt: new Date(),
      chosenMode: mode,
    };
    const entryB: QueueEntry = {
      userId: player2.userId,
      socketId: player2.socketId,
      username: player2.username,
      ratingPoint: player2.ratingPoint || 1000,
      joinedAt: new Date(),
      chosenMode: mode,
    };
    await this.createMatch(entryA, entryB, true);
  }
}
