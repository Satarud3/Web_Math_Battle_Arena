import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';
import { MatchMode, MatchStatus, MatchResult, Question } from '@prisma/client';
import { getTier } from '../common/utils/tier';
import { AchievementsService } from '../achievements/achievements.service';
import { checkAnswer, getCorrectAnswerString } from '../common/utils/answer';
import { RedisService } from '../redis/redis.service';

export interface RoomPlayer {
  userId: string;
  socketId: string;
  username: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  totalAnswerTimeMs: number;
  submittedAnswerThisQuestion: boolean;
  chosenOption?: string;
  isCorrect?: boolean;
  scoreEarnedThisQuestion?: number;
  answerTimeMsThisQuestion?: number;
  ratingPoint?: number;
}

export interface GameRoom {
  matchId: string;
  players: Record<string, RoomPlayer>; // key: userId
  questionOrder: string[];
  currentQuestionIndex: number; // 0-based index
  questionStartTime: number; // Date.now() timestamp
  timeoutRef?: NodeJS.Timeout;
  transitionTimeoutRef?: NodeJS.Timeout;
  checkpointTimeoutRef?: NodeJS.Timeout;
  questions: Map<string, Question>; // key: questionId
  battleMode: string;
  endTime?: number;
  isPrivate?: boolean;
}

@Injectable()
export class RoomService implements OnModuleInit, OnModuleDestroy {
  private server: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;

  public onPlayerStatusChange?: (userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME') => void | Promise<void>;
  public checkIsPlayerConnected?: (userId: string) => boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.startOrphanedTimerScanner();
  }

  onModuleDestroy() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
  }

  private startOrphanedTimerScanner() {
    this.scanInterval = setInterval(() => {
      this.checkOrphanedMatchTimers().catch((err) => {
        console.error('[RoomService Recovery Engine] Error in checkOrphanedMatchTimers:', err);
      });
    }, 4000);
  }

  public async checkOrphanedMatchTimers() {
    try {
      const activeMatchIds = await this.redisService.smembers('mba:active_matches');
      const now = Date.now();

      for (const matchId of activeMatchIds) {
        const roomData = await this.redisService.get<any>(`mba:game_room:${matchId}`);
        if (!roomData) {
          await this.redisService.srem('mba:active_matches', matchId);
          continue;
        }

        // If question end time passed >3.5 seconds ago and no transition occurred, take over!
        if (roomData.endTime && now > roomData.endTime + 3500) {
          const recoveryLock = await this.redisService.acquireLock(
            `mba:lock_recovery:${matchId}:${roomData.currentQuestionIndex}`,
            5000,
          );
          if (recoveryLock) {
            console.warn(
              `[RoomService Recovery Engine] Detected orphaned timer for match ${matchId} (index ${roomData.currentQuestionIndex}). Recovering match!`,
            );
            await this.hydrateAndRecoverRoom(matchId, roomData);
          }
        }
      }
    } catch (err: any) {
      console.error('[RoomService Recovery Engine] Error scanning orphaned match timers:', err);
    }
  }

  private async hydrateAndRecoverRoom(matchId: string, roomData: any) {
    let room = this.rooms.get(matchId);
    if (!room) {
      const questionList = await this.prisma.question.findMany({
        where: { id: { in: roomData.questionOrder } },
      });
      const questionsMap = new Map<string, Question>();
      for (const q of questionList) {
        questionsMap.set(q.id, q);
      }

      room = {
        matchId: roomData.matchId,
        players: roomData.players,
        questionOrder: roomData.questionOrder,
        currentQuestionIndex: roomData.currentQuestionIndex,
        questionStartTime: Date.now() - 15000,
        questions: questionsMap,
        battleMode: roomData.battleMode,
        isPrivate: roomData.isPrivate,
      };
      this.rooms.set(matchId, room);
    }

    await this.handleQuestionTimeout(matchId);
  }

  setServer(server: Server) {
    this.server = server;
  }

  getRoom(matchId: string): GameRoom | undefined {
    return this.rooms.get(matchId);
  }

  async createRoom(
    matchId: string,
    player1: { userId: string; socketId: string; username: string; ratingPoint?: number },
    player2: { userId: string; socketId: string; username: string; ratingPoint?: number },
    questionOrder: string[],
    battleMode: string,
    isPrivate = false,
  ) {
    // Fetch question details for the match
    const questionList = await this.prisma.question.findMany({
      where: { id: { in: questionOrder } },
    });

    const questionsMap = new Map<string, Question>();
    for (const q of questionList) {
      questionsMap.set(q.id, q);
    }

    const room: GameRoom = {
      matchId,
      players: {
        [player1.userId]: {
          userId: player1.userId,
          socketId: player1.socketId,
          username: player1.username,
          totalScore: 0,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          submittedAnswerThisQuestion: false,
          ratingPoint: player1.ratingPoint || 1000,
        },
        [player2.userId]: {
          userId: player2.userId,
          socketId: player2.socketId,
          username: player2.username,
          totalScore: 0,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          submittedAnswerThisQuestion: false,
          ratingPoint: player2.ratingPoint || 1000,
        },
      },
      questionOrder,
      currentQuestionIndex: 0,
      questionStartTime: 0,
      questions: questionsMap,
      battleMode: battleMode || 'ARENA',
      isPrivate,
    };

    this.rooms.set(matchId, room);
    await this.redisService.sadd('mba:active_matches', matchId);
    await this.redisService.set(`mba:game_room:${matchId}`, {
      matchId,
      players: room.players,
      questionOrder,
      currentQuestionIndex: 0,
      battleMode: room.battleMode,
      isPrivate,
    });

    // Update status to IN_GAME (wrapped in try-catch to prevent hanging)
    try {
      if (this.onPlayerStatusChange) {
        void this.onPlayerStatusChange(player1.userId, 'IN_GAME');
        void this.onPlayerStatusChange(player2.userId, 'IN_GAME');
      }
    } catch (e) {
      console.error('[RoomService] Gagal memperbarui status pemain ke IN_GAME:', e);
    }

    await this.sendQuestion(matchId);
  }

  async sendQuestion(matchId: string) {
    try {
      const room = this.rooms.get(matchId);
      if (!room) return;

      const questionId = room.questionOrder[room.currentQuestionIndex];
      const question = room.questions.get(questionId);

      if (!question) {
        // If question details not found, finish match immediately
        this.finishMatch(matchId).catch((err) => {
          console.error(`[RoomService] Async finishMatch failed in sendQuestion for match ${matchId}:`, err);
        });
        return;
      }

      const duration = room.battleMode === 'LIGHTNING' ? 10000 : room.battleMode === 'MARATHON' ? 35000 : room.battleMode === 'STRATEGY' ? 45000 : 15000;

      room.questionStartTime = Date.now();
      room.endTime = Date.now() + duration;
      const endTime = room.endTime;

      // Update Redis game room state with current question endTime
      await this.redisService.set(`mba:game_room:${matchId}`, {
        matchId,
        players: room.players,
        questionOrder: room.questionOrder,
        currentQuestionIndex: room.currentQuestionIndex,
        battleMode: room.battleMode,
        isPrivate: room.isPrivate,
        endTime,
      });

      // Reset player submissions for this question (Strict Reset)
      for (const p of Object.values(room.players)) {
        p.submittedAnswerThisQuestion = false;
        p.chosenOption = undefined;
        p.isCorrect = undefined;
        p.scoreEarnedThisQuestion = undefined;
        p.answerTimeMsThisQuestion = undefined;
      }

      // Emit question_sent event to room (only show question details, not answer/explanation)
      this.server.to(matchId).emit('question_sent', {
        currentQuestionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questionOrder.length,
        questionId: question.id,
        questionText: question.questionText,
        type: question.type,
        questionData: question.questionData,
        options: question.options,
        endTime,
      });

      // Schedule automatic timeout
      if (room.timeoutRef) clearTimeout(room.timeoutRef);
      room.timeoutRef = setTimeout(() => {
        try {
          this.handleQuestionTimeout(matchId);
        } catch (err) {
          console.error(`[RoomService] Error in timeout setTimeout for match ${matchId}:`, err);
        }
      }, duration);
    } catch (error) {
      console.error(`[RoomService] Error in sendQuestion for match ${matchId}:`, error);
    }
  }

  async submitAnswer(matchId: string, userId: string, chosenOption: string) {
    try {
      const room = this.rooms.get(matchId);
      if (!room) return;

      const player = room.players[userId];
      if (!player || player.submittedAnswerThisQuestion) return;

      const questionId = room.questionOrder[room.currentQuestionIndex];
      const question = room.questions.get(questionId);
      if (!question) return;

      const duration = room.battleMode === 'LIGHTNING' ? 10000 : room.battleMode === 'MARATHON' ? 35000 : room.battleMode === 'STRATEGY' ? 45000 : 15000;
      const elapsedMs = Date.now() - room.questionStartTime;

      // 500ms network grace period buffer for LIGHTNING and ARENA
      const graceBuffer = (room.battleMode === 'LIGHTNING' || room.battleMode === 'ARENA') ? 500 : 0;
      const sisaDetik = Math.max(0, (duration + graceBuffer - elapsedMs) / 1000);
      
      // Dynamic Answer Checking
      const isCorrect = checkAnswer(question.type, chosenOption, question);

      // Strategy Battle Sudden Death Trigger (if first player submits and > 10s left)
      if (room.battleMode === 'STRATEGY') {
        const alreadySubmittedCount = Object.values(room.players).filter((p) => p.submittedAnswerThisQuestion).length;
        if (alreadySubmittedCount === 0) {
          const remainingMs = room.endTime ? (room.endTime - Date.now()) : (duration - elapsedMs);
          if (remainingMs > 10000) {
            room.endTime = Date.now() + 10000;
            if (room.timeoutRef) clearTimeout(room.timeoutRef);
            room.timeoutRef = setTimeout(() => {
              try {
                this.handleQuestionTimeout(matchId);
              } catch (err) {
                console.error(`[RoomService] Error in strategy timeout setTimeout for match ${matchId}:`, err);
              }
            }, 10000);

            // Emit sudden death event
            this.server.to(matchId).emit('strategy_sudden_death', {
              endTime: room.endTime,
              triggerUserId: userId,
            });
          }
        }
      }

      // Calculate score based on battleMode
      let scoreEarned = 0;
      if (isCorrect) {
        if (room.battleMode === 'STRATEGY') {
          // Soft-timer speed ranking: first correct = 100 PTS, second correct = 70 PTS
          const otherPlayer = Object.values(room.players).find((p) => p.userId !== userId);
          const otherIsCorrect = otherPlayer && otherPlayer.submittedAnswerThisQuestion && otherPlayer.isCorrect;
          scoreEarned = otherIsCorrect ? 70 : 100;
        } else if (room.battleMode === 'MARATHON') {
          // Marathon: flat score (accuracy-focused, no speed bonus)
          scoreEarned = question.baseScore;
        } else {
          // LIGHTNING (10s) or ARENA (15s) with time bonus multiplier (3x for Lightning, 2x for Arena)
          let difficultyBonus = 0;
          if (question.difficulty === 'MEDIUM') difficultyBonus = 30;
          else if (question.difficulty === 'HARD') difficultyBonus = 60;

          const timeMultiplier = room.battleMode === 'LIGHTNING' ? 3 : 2;
          scoreEarned = Math.round(question.baseScore + sisaDetik * timeMultiplier + difficultyBonus);
        }
      }

      // Record player state
      player.submittedAnswerThisQuestion = true;
      player.chosenOption = chosenOption;
      player.isCorrect = isCorrect;
      player.scoreEarnedThisQuestion = scoreEarned;
      player.answerTimeMsThisQuestion = Math.min(duration, Math.round(elapsedMs));

      // Update totals
      player.totalScore += scoreEarned;
      if (isCorrect) {
        player.correctCount++;
      } else {
        player.wrongCount++;
      }
      player.totalAnswerTimeMs += Math.min(duration, Math.round(elapsedMs));

      // Save answer record to database in background
      this.prisma.answer.create({
        data: {
          matchId,
          userId,
          questionId: question.id,
          selectedAnswer: chosenOption,
          isCorrect,
          answerTimeMs: Math.min(duration, Math.round(elapsedMs)),
          scoreEarned,
        },
      }).catch((err) => {
        console.error(`Failed to save answer record asynchronously for user ${userId} in match ${matchId}:`, err);
      });

      // Notify other player that this player answered (without revealing details)
      this.server.to(matchId).emit('player_answered', {
        userId,
      });

      // If both players have submitted, process question end immediately
      const allSubmitted = Object.values(room.players).every(
        (p) => p.submittedAnswerThisQuestion,
      );

      if (allSubmitted) {
        if (room.timeoutRef) clearTimeout(room.timeoutRef);
        this.processQuestionEnd(matchId);
      }
    } catch (error) {
      console.error(`[RoomService] Error in submitAnswer for match ${matchId} by user ${userId}:`, error);
      // Fallback: try to advance or timeout anyway
      this.processQuestionEnd(matchId);
    }
  }

  async handleQuestionTimeout(matchId: string) {
    try {
      const room = this.rooms.get(matchId);
      if (!room) return;

      const lockAcquired = await this.redisService.acquireLock(`mba:lock_timeout:${matchId}:${room.currentQuestionIndex}`, 4000);
      if (!lockAcquired) {
        console.log(`[RoomService] Timeout lock for match ${matchId} index ${room.currentQuestionIndex} already acquired by another node.`);
        return;
      }

      const questionId = room.questionOrder[room.currentQuestionIndex];
      const question = room.questions.get(questionId);
      if (!question) return;

      const duration = room.battleMode === 'LIGHTNING' ? 10000 : room.battleMode === 'MARATHON' ? 35000 : room.battleMode === 'STRATEGY' ? 45000 : 15000;

      // For any player who didn't submit, save a timeout answer
      for (const player of Object.values(room.players)) {
        if (!player.submittedAnswerThisQuestion) {
          player.submittedAnswerThisQuestion = true;
          player.chosenOption = 'TIMEOUT';
          player.isCorrect = false;
          player.scoreEarnedThisQuestion = 0;
          player.answerTimeMsThisQuestion = duration;
          player.wrongCount++;
          player.totalAnswerTimeMs += duration;

          this.prisma.answer.create({
            data: {
              matchId,
              userId: player.userId,
              questionId: question.id,
              selectedAnswer: 'TIMEOUT',
              isCorrect: false,
              answerTimeMs: duration,
              scoreEarned: 0,
            },
          }).catch((err) => {
            console.error(`Failed to save timeout answer record asynchronously for user ${player.userId} in match ${matchId}:`, err);
          });
        }
      }

      this.processQuestionEnd(matchId);
    } catch (error) {
      console.error(`[RoomService] Error in handleQuestionTimeout for match ${matchId}:`, error);
      // Fallback: try to advance anyway
      this.processQuestionEnd(matchId);
    }
  }

  processQuestionEnd(matchId: string) {
    try {
      const room = this.rooms.get(matchId);
      if (!room) return;

      const questionId = room.questionOrder[room.currentQuestionIndex];
      const question = room.questions.get(questionId);
      if (!question) return;

      const payloadPlayers: Record<string, any> = {};
      for (const [uId, p] of Object.entries(room.players)) {
        payloadPlayers[uId] = {
          chosenOption: p.chosenOption,
          isCorrect: p.isCorrect,
          scoreEarned: p.scoreEarnedThisQuestion,
          totalScore: p.totalScore,
        };
      }

      // Emit answer result (reveals correctAnswer and explanation)
      this.server.to(matchId).emit('answer_result', {
        matchId,
        correctAnswer: getCorrectAnswerString(question),
        explanation: question.explanation || '',
        players: payloadPlayers,
      });

      // Wait 3 seconds, then advance
      if (room.transitionTimeoutRef) clearTimeout(room.transitionTimeoutRef);
      room.transitionTimeoutRef = setTimeout(() => {
        try {
          this.advanceQuestion(matchId);
        } catch (err) {
          console.error(`[RoomService] Error in advanceQuestion setTimeout for match ${matchId}:`, err);
        }
      }, 3000);
    } catch (error) {
      console.error(`[RoomService] Error in processQuestionEnd for match ${matchId}:`, error);
      // Fallback: try to advance anyway
      try {
        this.advanceQuestion(matchId);
      } catch (err) {
        console.error(`[RoomService] Fallback advanceQuestion failed for match ${matchId}:`, err);
      }
    }
  }

  async advanceQuestion(matchId: string) {
    try {
      const room = this.rooms.get(matchId);
      if (!room) return;

      const lockAcquired = await this.redisService.acquireLock(`mba:lock_advance:${matchId}:${room.currentQuestionIndex}`, 4000);
      if (!lockAcquired) {
        console.log(`[RoomService] Advance lock for match ${matchId} index ${room.currentQuestionIndex} already acquired by another node.`);
        return;
      }

      if (room.currentQuestionIndex + 1 === room.questionOrder.length) {
        this.finishMatch(matchId).catch((err) => {
          console.error(`[RoomService] Async finishMatch failed for match ${matchId}:`, err);
        });
      } else {
        // Marathon Checkpoint System (Stamina Break every 10 questions)
        const currentQuestionNum = room.currentQuestionIndex + 1;
        if (room.battleMode === 'MARATHON' && currentQuestionNum % 10 === 0) {
          const currentCheckpoint = Math.floor(currentQuestionNum / 10);

          // Find leader
          const players = Object.values(room.players);
          let leaderUserId = players[0].userId;
          if (players[1] && players[1].totalScore > players[0].totalScore) {
            leaderUserId = players[1].userId;
          } else if (players[1] && players[1].totalScore === players[0].totalScore) {
            if (players[1].correctCount > players[0].correctCount) {
              leaderUserId = players[1].userId;
            }
          }

          this.server.to(matchId).emit('marathon_checkpoint', {
            currentCheckpoint,
            leaderUserId,
            resumeTime: Date.now() + 7000,
          });

          if (room.checkpointTimeoutRef) clearTimeout(room.checkpointTimeoutRef);
          room.checkpointTimeoutRef = setTimeout(() => {
            try {
              room.currentQuestionIndex++;
              this.sendQuestion(matchId);
            } catch (err) {
              console.error(`[RoomService] Error in marathon checkpoint resume setTimeout for match ${matchId}:`, err);
            }
          }, 7000);
        } else {
          room.currentQuestionIndex++;
          this.sendQuestion(matchId);
        }
      }
    } catch (error) {
      console.error(`[RoomService] Error in advanceQuestion for match ${matchId}:`, error);
    }
  }

  async finishMatch(matchId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    // Clear timeout references
    if (room.timeoutRef) clearTimeout(room.timeoutRef);
    if (room.transitionTimeoutRef) clearTimeout(room.transitionTimeoutRef);
    if (room.checkpointTimeoutRef) clearTimeout(room.checkpointTimeoutRef);

    const players = Object.values(room.players);
    if (players.length < 2) {
      this.rooms.delete(matchId);
      await this.redisService.del(`mba:game_room:${matchId}`);
      await this.redisService.srem('mba:active_matches', matchId);
      return;
    }

    try {
      const p1 = players[0];
      const p2 = players[1];

      let winnerId: string | null = null;
      let p1Result: MatchResult = MatchResult.DRAW;
      let p2Result: MatchResult = MatchResult.DRAW;

      if (p1.totalScore > p2.totalScore) {
        winnerId = p1.userId;
        p1Result = MatchResult.WIN;
        p2Result = MatchResult.LOSE;
      } else if (p2.totalScore > p1.totalScore) {
        winnerId = p2.userId;
        p1Result = MatchResult.LOSE;
        p2Result = MatchResult.WIN;
      } else {
        // Tie breaker 1: Accuracy (correct count)
        if (p1.correctCount > p2.correctCount) {
          winnerId = p1.userId;
          p1Result = MatchResult.WIN;
          p2Result = MatchResult.LOSE;
        } else if (p2.correctCount > p1.correctCount) {
          winnerId = p2.userId;
          p1Result = MatchResult.LOSE;
          p2Result = MatchResult.WIN;
        } else {
          // Tie breaker 2: Avg Answer Time (total time / answered count)
          const p1Avg = p1.correctCount + p1.wrongCount > 0 
            ? p1.totalAnswerTimeMs / (p1.correctCount + p1.wrongCount) 
            : 99999;
          const p2Avg = p2.correctCount + p2.wrongCount > 0 
            ? p2.totalAnswerTimeMs / (p2.correctCount + p2.wrongCount) 
            : 99999;

          if (p1Avg < p2Avg) {
            winnerId = p1.userId;
            p1Result = MatchResult.WIN;
            p2Result = MatchResult.LOSE;
          } else if (p2Avg < p1Avg) {
            winnerId = p2.userId;
            p1Result = MatchResult.LOSE;
            p2Result = MatchResult.WIN;
          }
        }
      }

      const mmrChanges: Record<string, number> = {};

      // Execute atomic transaction for match updates
      await this.prisma.$transaction(async (tx) => {
        // 1. Update Match record
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.FINISHED,
            winnerUserId: winnerId,
            endedAt: new Date(),
          },
        });

        // 2. Update MatchPlayer records
        for (const p of players) {
          // Pessimistic Row Locking to prevent Lost Updates under high concurrency
          await tx.$executeRaw`SELECT 1 FROM rankings WHERE user_id = ${p.userId}::uuid FOR UPDATE`;
          await tx.$executeRaw`SELECT 1 FROM user_stats WHERE user_id = ${p.userId}::uuid FOR UPDATE`;

          const result = p.userId === winnerId ? MatchResult.WIN : winnerId === null ? MatchResult.DRAW : MatchResult.LOSE;
          const avgAnswerTime = p.correctCount + p.wrongCount > 0 ? p.totalAnswerTimeMs / 1000 / (p.correctCount + p.wrongCount) : 0;

          await tx.matchPlayer.update({
            where: {
              matchId_userId: {
                matchId,
                userId: p.userId,
              },
            },
            data: {
              totalScore: p.totalScore,
              correctCount: p.correctCount,
              wrongCount: p.wrongCount,
              avgAnswerTime,
              result,
            },
          });

          // 3. Update UserStats (only if NOT private match)
          if (!room.isPrivate) {
            const stats = await tx.userStats.findUnique({
              where: { userId: p.userId },
            });

            if (stats) {
              const totalMatches = stats.totalMatches + 1;
              const totalWins = stats.totalWins + (result === MatchResult.WIN ? 1 : 0);
              const totalLosses = stats.totalLosses + (result === MatchResult.LOSE ? 1 : 0);
              const totalDraws = stats.totalDraws + (result === MatchResult.DRAW ? 1 : 0);
              const totalQuestionsAnswered = stats.totalQuestionsAnswered + room.questionOrder.length;
              const totalCorrectAnswers = stats.totalCorrectAnswers + p.correctCount;
              const accuracy = totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0;
              const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
              const currentStreak = result === MatchResult.WIN ? stats.currentStreak + 1 : 0;

              await tx.userStats.update({
                where: { userId: p.userId },
                data: {
                  totalMatches,
                  totalWins,
                  totalLosses,
                  totalDraws,
                  totalQuestionsAnswered,
                  totalCorrectAnswers,
                  accuracy: parseFloat(accuracy.toFixed(2)),
                  winRate: parseFloat(winRate.toFixed(2)),
                  currentStreak,
                },
              });
            }
          }

          // 4. Update MMR in Ranking (only if NOT private match)
          const ranking = await tx.ranking.findUnique({
            where: { userId: p.userId },
          });

          if (ranking) {
            const oldPoint = Number(ranking.ratingPoint);
            let change = 0;
            if (result === MatchResult.WIN) change = 25;
            else if (result === MatchResult.LOSE) change = -10;
            else if (result === MatchResult.DRAW) change = 5;

            const newPoint = Math.max(0, oldPoint + change);
            
            if (!room.isPrivate) {
              mmrChanges[p.userId] = change;
              await tx.ranking.update({
                where: { userId: p.userId },
                data: {
                  ratingPoint: newPoint,
                  tier: getTier(newPoint),
                },
              });

              // Log point change
              await tx.leaderboardLog.create({
                data: {
                  rankingId: ranking.id,
                  matchId,
                  oldPoint,
                  newPoint,
                  changePoint: change,
                },
              });
            } else {
              mmrChanges[p.userId] = 0; // Private room matches do not affect MMR
            }
          }
        }
      });

      // Evaluate Achievements for both players
      let p1Achievements: any[] = [];
      let p2Achievements: any[] = [];
      try {
        p1Achievements = await this.achievementsService.evaluateMatchAchievements(p1.userId, matchId);
      } catch (err) {
        console.error(`[RoomService] Failed to evaluate achievements for user ${p1.userId}:`, err);
      }
      try {
        p2Achievements = await this.achievementsService.evaluateMatchAchievements(p2.userId, matchId);
      } catch (err) {
        console.error(`[RoomService] Failed to evaluate achievements for user ${p2.userId}:`, err);
      }

      // Emit match_finished to both players
      this.server.to(matchId).emit('match_finished', {
        matchId,
        winnerUserId: winnerId,
        scores: {
          [p1.userId]: p1.totalScore,
          [p2.userId]: p2.totalScore,
        },
        results: {
          [p1.userId]: p1Result,
          [p2.userId]: p2Result,
        },
        mmrChanges,
        unlockedAchievements: {
          [p1.userId]: p1Achievements,
          [p2.userId]: p2Achievements,
        },
      });

      // Revert status to ONLINE/OFFLINE based on connection (wrapped in try-catch to prevent hanging)
      try {
        if (this.onPlayerStatusChange) {
          for (const player of players) {
            const isConnected = this.checkIsPlayerConnected?.(player.userId) ?? false;
            const newStatus = isConnected ? 'ONLINE' : 'OFFLINE';
            void this.onPlayerStatusChange(player.userId, newStatus);
          }
        }
      } catch (e) {
        console.error('[RoomService] Gagal mengembalikan status pemain setelah pertandingan selesai:', e);
      }
    } catch (error) {
      console.error(`[RoomService] Fatal error finishing match ${matchId}:`, error);
      // Fallback: Emit finished so client is not stuck
      this.server.to(matchId).emit('match_finished', {
        matchId,
        error: 'Pertandingan selesai dengan kesalahan teknis.',
      });
    } finally {
      // Always cleanup room to prevent memory leak and release players
      this.rooms.delete(matchId);
      await this.redisService.del(`mba:game_room:${matchId}`);
    }
  }

  // Handle early exit if player disconnects/leaves
  async handlePlayerLeave(matchId: string, leavingUserId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    // Clear timeout references
    if (room.timeoutRef) clearTimeout(room.timeoutRef);
    if (room.transitionTimeoutRef) clearTimeout(room.transitionTimeoutRef);
    if (room.checkpointTimeoutRef) clearTimeout(room.checkpointTimeoutRef);

    const players = Object.values(room.players);
    const stayingPlayer = players.find((p) => p.userId !== leavingUserId);

    if (!stayingPlayer) {
      // Both players left, simple cleanup
      this.rooms.delete(matchId);
      return;
    }

    try {
      // Assign staying player as winner
      const winnerId = stayingPlayer.userId;
      const mmrChanges: Record<string, number> = {};

      await this.prisma.$transaction(async (tx) => {
        // 1. Update Match record
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.FINISHED,
            winnerUserId: winnerId,
            endedAt: new Date(),
          },
        });

        // 2. Update players records
        for (const p of players) {
          const result = p.userId === winnerId ? MatchResult.WIN : MatchResult.LOSE;
          const avgAnswerTime = p.correctCount + p.wrongCount > 0 ? p.totalAnswerTimeMs / 1000 / (p.correctCount + p.wrongCount) : 0;

          await tx.matchPlayer.update({
            where: {
              matchId_userId: {
                matchId,
                userId: p.userId,
              },
            },
            data: {
              totalScore: p.totalScore,
              correctCount: p.correctCount,
              wrongCount: p.wrongCount,
              avgAnswerTime,
              result,
            },
          });

          // 3. Update UserStats
          const stats = await tx.userStats.findUnique({
            where: { userId: p.userId },
          });

          if (stats) {
            const totalMatches = stats.totalMatches + 1;
            const totalWins = stats.totalWins + (result === MatchResult.WIN ? 1 : 0);
            const totalLosses = stats.totalLosses + (result === MatchResult.LOSE ? 1 : 0);
            const totalQuestionsAnswered = stats.totalQuestionsAnswered + room.currentQuestionIndex;
            const totalCorrectAnswers = stats.totalCorrectAnswers + p.correctCount;
            const accuracy = totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0;
            const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
            const currentStreak = result === MatchResult.WIN ? stats.currentStreak + 1 : 0;

            await tx.userStats.update({
              where: { userId: p.userId },
              data: {
                totalMatches,
                totalWins,
                totalLosses,
                totalQuestionsAnswered,
                totalCorrectAnswers,
                accuracy: parseFloat(accuracy.toFixed(2)),
                winRate: parseFloat(winRate.toFixed(2)),
                currentStreak,
              },
            });
          }

          // 4. Update MMR
          const ranking = await tx.ranking.findUnique({
            where: { userId: p.userId },
          });

          if (ranking) {
            const oldPoint = Number(ranking.ratingPoint);
            const change = result === MatchResult.WIN ? 25 : -10;
            const newPoint = Math.max(0, oldPoint + change);
            mmrChanges[p.userId] = change;

            await tx.ranking.update({
              where: { userId: p.userId },
              data: {
                ratingPoint: newPoint,
                tier: getTier(newPoint),
              },
            });

            await tx.leaderboardLog.create({
              data: {
                rankingId: ranking.id,
                matchId,
                oldPoint,
                newPoint,
                changePoint: change,
              },
            });
          }
        }
      });

      // Evaluate Achievements for both players
      let p1Achievements: any[] = [];
      let p2Achievements: any[] = [];
      try {
        p1Achievements = await this.achievementsService.evaluateMatchAchievements(players[0].userId, matchId);
      } catch (err) {
        console.error(`[RoomService] Failed to evaluate achievements for user ${players[0].userId}:`, err);
      }
      try {
        p2Achievements = await this.achievementsService.evaluateMatchAchievements(players[1].userId, matchId);
      } catch (err) {
        console.error(`[RoomService] Failed to evaluate achievements for user ${players[1].userId}:`, err);
      }

      this.server.to(matchId).emit('match_finished', {
        matchId,
        winnerUserId: winnerId,
        scores: {
          [players[0].userId]: players[0].totalScore,
          [players[1].userId]: players[1].totalScore,
        },
        results: {
          [players[0].userId]: players[0].userId === winnerId ? MatchResult.WIN : MatchResult.LOSE,
          [players[1].userId]: players[1].userId === winnerId ? MatchResult.WIN : MatchResult.LOSE,
        },
        mmrChanges,
        reason: 'Lawan meninggalkan pertandingan',
        unlockedAchievements: {
          [players[0].userId]: p1Achievements,
          [players[1].userId]: p2Achievements,
        },
      });

      // Revert status to ONLINE/OFFLINE based on connection (wrapped in try-catch to prevent hanging)
      try {
        if (this.onPlayerStatusChange) {
          for (const p of players) {
            const isConnected = this.checkIsPlayerConnected?.(p.userId) ?? false;
            const newStatus = isConnected ? 'ONLINE' : 'OFFLINE';
            void this.onPlayerStatusChange(p.userId, newStatus);
          }
        }
      } catch (e) {
        console.error('[RoomService] Gagal mengembalikan status pemain setelah pemain keluar:', e);
      }
    } catch (error) {
      console.error(`[RoomService] Error handling player leaving match ${matchId}:`, error);
      this.server.to(matchId).emit('match_finished', {
        matchId,
        error: 'Pertandingan selesai karena salah satu pemain keluar dengan kesalahan teknis.',
      });
    } finally {
      // Clean up map room
      this.rooms.delete(matchId);
    }
  }
}
