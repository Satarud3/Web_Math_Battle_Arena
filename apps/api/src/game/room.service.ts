import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';
import { MatchMode, MatchStatus, MatchResult, Question } from '@prisma/client';

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
}

export interface GameRoom {
  matchId: string;
  players: Record<string, RoomPlayer>; // key: userId
  questionOrder: string[];
  currentQuestionIndex: number; // 0-based index
  questionStartTime: number; // Date.now() timestamp
  timeoutRef?: NodeJS.Timeout;
  questions: Map<string, Question>; // key: questionId
}

@Injectable()
export class RoomService {
  private server: Server;
  private rooms: Map<string, GameRoom> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  getRoom(matchId: string): GameRoom | undefined {
    return this.rooms.get(matchId);
  }

  async createRoom(
    matchId: string,
    player1: { userId: string; socketId: string; username: string },
    player2: { userId: string; socketId: string; username: string },
    questionOrder: string[],
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
        },
      },
      questionOrder,
      currentQuestionIndex: 0,
      questionStartTime: 0,
      questions: questionsMap,
    };

    this.rooms.set(matchId, room);
    this.sendQuestion(matchId);
  }

  sendQuestion(matchId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    const questionId = room.questionOrder[room.currentQuestionIndex];
    const question = room.questions.get(questionId);

    if (!question) {
      // If question details not found, finish match immediately
      this.finishMatch(matchId);
      return;
    }

    room.questionStartTime = Date.now();
    const endTime = Date.now() + 15000; // 15 seconds from now

    // Reset player submissions for this question
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
      options: question.options,
      endTime,
    });

    // Schedule automatic timeout in 15 seconds
    if (room.timeoutRef) clearTimeout(room.timeoutRef);
    room.timeoutRef = setTimeout(() => {
      this.handleQuestionTimeout(matchId);
    }, 15000);
  }

  async submitAnswer(matchId: string, userId: string, chosenOption: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    const player = room.players[userId];
    if (!player || player.submittedAnswerThisQuestion) return;

    const questionId = room.questionOrder[room.currentQuestionIndex];
    const question = room.questions.get(questionId);
    if (!question) return;

    const elapsedMs = Date.now() - room.questionStartTime;
    const sisaDetik = Math.max(0, (15000 - elapsedMs) / 1000);
    
    // Case-insensitive and whitespace defensive check
    const isCorrect = chosenOption.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();

    // Time bonus logic: baseScore + (sisaDetik * 2) + difficultyBonus
    let difficultyBonus = 0;
    if (question.difficulty === 'MEDIUM') difficultyBonus = 30;
    else if (question.difficulty === 'HARD') difficultyBonus = 60;

    const scoreEarned = isCorrect
      ? Math.round(question.baseScore + sisaDetik * 2 + difficultyBonus)
      : 0;

    // Record player state
    player.submittedAnswerThisQuestion = true;
    player.chosenOption = chosenOption;
    player.isCorrect = isCorrect;
    player.scoreEarnedThisQuestion = scoreEarned;
    player.answerTimeMsThisQuestion = Math.round(elapsedMs);

    // Update totals
    player.totalScore += scoreEarned;
    if (isCorrect) {
      player.correctCount++;
    } else {
      player.wrongCount++;
    }
    player.totalAnswerTimeMs += Math.round(elapsedMs);

    // Save answer record to database in real-time
    await this.prisma.answer.create({
      data: {
        matchId,
        userId,
        questionId: question.id,
        selectedAnswer: chosenOption,
        isCorrect,
        answerTimeMs: Math.round(elapsedMs),
        scoreEarned,
      },
    });

    // Notify other player that this player answered (without revealing details)
    this.server.to(matchId).emit('player_answered', {
      userId,
    });

    console.log(`[Socket.IO Room] Match ${matchId} - Player ${userId} answer registered (${chosenOption}). isCorrect: ${isCorrect}`);

    // Check if both players have answered
    const allAnswered = Object.values(room.players).every(
      (p) => p.submittedAnswerThisQuestion,
    );

    console.log(`[Socket.IO Room] Match ${matchId} - allAnswered is ${allAnswered}. Player states:`, 
      Object.values(room.players).map(p => `${p.username}: ${p.submittedAnswerThisQuestion}`)
    );

    if (allAnswered) {
      console.log(`[Socket.IO Room] Match ${matchId} - both players answered. Transitioning to next question immediately.`);
      if (room.timeoutRef) {
        clearTimeout(room.timeoutRef);
        room.timeoutRef = undefined;
      }
      this.processQuestionEnd(matchId);
    }
  }

  async handleQuestionTimeout(matchId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    const questionId = room.questionOrder[room.currentQuestionIndex];
    const question = room.questions.get(questionId);
    if (!question) return;

    // For any player who didn't submit, save a timeout answer
    for (const player of Object.values(room.players)) {
      if (!player.submittedAnswerThisQuestion) {
        player.submittedAnswerThisQuestion = true;
        player.chosenOption = 'TIMEOUT';
        player.isCorrect = false;
        player.scoreEarnedThisQuestion = 0;
        player.answerTimeMsThisQuestion = 15000;
        player.wrongCount++;
        player.totalAnswerTimeMs += 15000;

        await this.prisma.answer.create({
          data: {
            matchId,
            userId: player.userId,
            questionId: question.id,
            selectedAnswer: 'TIMEOUT',
            isCorrect: false,
            answerTimeMs: 15000,
            scoreEarned: 0,
          },
        });
      }
    }

    this.processQuestionEnd(matchId);
  }

  processQuestionEnd(matchId: string) {
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
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      players: payloadPlayers,
    });

    // Wait 3 seconds, then advance
    setTimeout(() => {
      this.advanceQuestion(matchId);
    }, 3000);
  }

  advanceQuestion(matchId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    if (room.currentQuestionIndex + 1 === room.questionOrder.length) {
      this.finishMatch(matchId);
    } else {
      room.currentQuestionIndex++;
      this.sendQuestion(matchId);
    }
  }

  async finishMatch(matchId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    // Clear timeout references
    if (room.timeoutRef) clearTimeout(room.timeoutRef);

    const players = Object.values(room.players);
    if (players.length < 2) return;

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

        // 3. Update UserStats
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
            },
          });
        }

        // 4. Update MMR in Ranking
        const ranking = await tx.ranking.findUnique({
          where: { userId: p.userId },
        });

        if (ranking) {
          const oldPoint = ranking.ratingPoint;
          let change = 0;
          if (result === MatchResult.WIN) change = 25;
          else if (result === MatchResult.LOSE) change = -20;

          const newPoint = Math.max(0, oldPoint + change);
          mmrChanges[p.userId] = change;

          await tx.ranking.update({
            where: { userId: p.userId },
            data: {
              ratingPoint: newPoint,
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
        }
      }
    });

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
    });

    // Strict Cleanup for memory leak prevention
    this.rooms.delete(matchId);
  }

  // Handle early exit if player disconnects/leaves
  async handlePlayerLeave(matchId: string, leavingUserId: string) {
    const room = this.rooms.get(matchId);
    if (!room) return;

    // Clear timeout references
    if (room.timeoutRef) clearTimeout(room.timeoutRef);

    const players = Object.values(room.players);
    const stayingPlayer = players.find((p) => p.userId !== leavingUserId);

    if (!stayingPlayer) {
      // Both players left, simple cleanup
      this.rooms.delete(matchId);
      return;
    }

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
            },
          });
        }

        // 4. Update MMR
        const ranking = await tx.ranking.findUnique({
          where: { userId: p.userId },
        });

        if (ranking) {
          const oldPoint = ranking.ratingPoint;
          const change = result === MatchResult.WIN ? 25 : -20;
          const newPoint = Math.max(0, oldPoint + change);
          mmrChanges[p.userId] = change;

          await tx.ranking.update({
            where: { userId: p.userId },
            data: {
              ratingPoint: newPoint,
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
    });

    // Clean up map room
    this.rooms.delete(matchId);
  }
}
