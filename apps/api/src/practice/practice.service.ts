import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Difficulty, MatchMode, MatchStatus } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async startPractice(userId: string, dto: StartPracticeDto) {
    const whereClause: any = { isActive: true };
    if (dto.categoryId) {
      whereClause.categoryId = dto.categoryId;
    }
    if (dto.difficulty) {
      whereClause.difficulty = dto.difficulty;
    }

    // Fetch all active questions matching criteria
    const questions = await this.prisma.question.findMany({
      where: whereClause,
    });

    if (questions.length === 0) {
      throw new NotFoundException('Tidak ada soal yang tersedia untuk kategori atau kesulitan ini.');
    }

    // Shuffle in TypeScript memory to workaround Prisma ORDER BY RANDOM
    const shuffledQuestions = shuffleArray(questions);
    
    // Slice according to totalQuestions requested (5, 10, 20)
    const totalToSelect = Math.min(dto.totalQuestions || 10, shuffledQuestions.length);
    const selectedQuestions = shuffledQuestions.slice(0, totalToSelect);
    const questionIds = selectedQuestions.map((q) => q.id);

    // Create match and match player records atomically
    const match = await this.prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          mode: MatchMode.PRACTICE,
          status: MatchStatus.ACTIVE,
          totalQuestions: questionIds.length,
          questionOrder: questionIds,
          startedAt: new Date(),
        },
      });

      await tx.matchPlayer.create({
        data: {
          matchId: newMatch.id,
          userId: userId,
          totalScore: 0,
          correctCount: 0,
          wrongCount: 0,
          avgAnswerTime: 0.0,
        },
      });

      return newMatch;
    });

    // Return first question (exclude correctAnswer & explanation for security/anti-cheat)
    const firstQuestion = selectedQuestions[0];

    return {
      matchId: match.id,
      totalQuestions: match.totalQuestions,
      currentQuestionIndex: 1,
      question: {
        id: firstQuestion.id,
        questionText: firstQuestion.questionText,
        options: firstQuestion.options,
        difficulty: firstQuestion.difficulty,
        baseScore: firstQuestion.baseScore,
      },
    };
  }

  async getCurrentQuestion(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          where: { userId },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (match.mode !== MatchMode.PRACTICE) {
      throw new BadRequestException('Sesi ini bukan sesi latihan.');
    }

    if (match.matchPlayers.length === 0) {
      throw new BadRequestException('Anda bukan bagian dari sesi latihan ini.');
    }

    if (match.status === MatchStatus.FINISHED) {
      return { finished: true };
    }

    const answeredCount = await this.prisma.answer.count({
      where: { matchId, userId },
    });

    const questionOrder = match.questionOrder as string[];
    if (!questionOrder || questionOrder.length === 0) {
      throw new BadRequestException('Order soal tidak ditemukan pada sesi ini.');
    }

    if (answeredCount >= match.totalQuestions) {
      // Auto-finish match if somehow all answered but status is still active
      await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.FINISHED,
          endedAt: new Date(),
        },
      });
      return { finished: true };
    }

    const activeQuestionId = questionOrder[answeredCount];
    const question = await this.prisma.question.findUnique({
      where: { id: activeQuestionId },
    });

    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan.');
    }

    return {
      matchId: match.id,
      totalQuestions: match.totalQuestions,
      currentQuestionIndex: answeredCount + 1,
      question: {
        id: question.id,
        questionText: question.questionText,
        options: question.options,
        difficulty: question.difficulty,
        baseScore: question.baseScore,
      },
    };
  }

  async submitAnswer(matchId: string, userId: string, dto: SubmitAnswerDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          where: { userId },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (match.mode !== MatchMode.PRACTICE) {
      throw new BadRequestException('Sesi ini bukan sesi latihan.');
    }

    if (match.status !== MatchStatus.ACTIVE) {
      throw new BadRequestException('Sesi latihan sudah tidak aktif atau selesai.');
    }

    if (match.matchPlayers.length === 0) {
      throw new BadRequestException('Anda tidak berpartisipasi dalam sesi ini.');
    }

    const questionOrder = match.questionOrder as string[];
    if (!questionOrder || questionOrder.length === 0) {
      throw new BadRequestException('Data urutan soal tidak valid.');
    }

    // Determine current question based on number of existing answers
    const answeredCount = await this.prisma.answer.count({
      where: { matchId, userId },
    });

    if (answeredCount >= match.totalQuestions) {
      throw new BadRequestException('Semua soal dalam sesi latihan ini sudah dijawab.');
    }

    const activeQuestionId = questionOrder[answeredCount];
    const question = await this.prisma.question.findUnique({
      where: { id: activeQuestionId },
    });

    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan.');
    }

    const isCorrect = dto.chosenOption === question.correctAnswer;
    const scoreEarned = isCorrect ? question.baseScore : 0;
    const isLastQuestion = answeredCount + 1 === match.totalQuestions;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Save answer
      const newAnswer = await tx.answer.create({
        data: {
          matchId,
          userId,
          questionId: question.id,
          selectedAnswer: dto.chosenOption,
          isCorrect,
          answerTimeMs: dto.answerTimeMs || 0,
          scoreEarned,
        },
      });

      // 2. Fetch all answers for this match & player to calculate cumulative match stats
      const playerAnswers = await tx.answer.findMany({
        where: { matchId, userId },
      });

      const correctCount = playerAnswers.filter((a) => a.isCorrect).length;
      const wrongCount = playerAnswers.filter((a) => !a.isCorrect).length;
      const totalScore = playerAnswers.reduce((sum, a) => sum + a.scoreEarned, 0);
      const totalTime = playerAnswers.reduce((sum, a) => sum + a.answerTimeMs, 0);
      const avgAnswerTime = playerAnswers.length > 0 ? totalTime / playerAnswers.length : 0;

      // 3. Update MatchPlayer
      await tx.matchPlayer.update({
        where: {
          matchId_userId: { matchId, userId },
        },
        data: {
          totalScore,
          correctCount,
          wrongCount,
          avgAnswerTime,
        },
      });

      // 4. Handle end of match
      if (isLastQuestion) {
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.FINISHED,
            endedAt: new Date(),
          },
        });

        // Update UserStats: totalQuestionsAnswered, totalCorrectAnswers, and accuracy.
        // We MUST NOT change MMR/Ranking, totalMatches, wins, losses.
        const existingStats = await tx.userStats.findUnique({
          where: { userId },
        });

        if (existingStats) {
          const newTotalQuestions = existingStats.totalQuestionsAnswered + match.totalQuestions;
          const newTotalCorrect = existingStats.totalCorrectAnswers + correctCount;
          const newAccuracy = newTotalQuestions > 0 ? (newTotalCorrect / newTotalQuestions) * 100 : 0.0;

          await tx.userStats.update({
            where: { userId },
            data: {
              totalQuestionsAnswered: newTotalQuestions,
              totalCorrectAnswers: newTotalCorrect,
              accuracy: parseFloat(newAccuracy.toFixed(2)),
            },
          });
        } else {
          const accuracy = match.totalQuestions > 0 ? (correctCount / match.totalQuestions) * 100 : 0.0;
          await tx.userStats.create({
            data: {
              userId,
              totalQuestionsAnswered: match.totalQuestions,
              totalCorrectAnswers: correctCount,
              accuracy: parseFloat(accuracy.toFixed(2)),
            },
          });
        }
      }

      return newAnswer;
    });

    let unlockedAchievements: any[] = [];
    if (isLastQuestion) {
      unlockedAchievements = await this.achievementsService.evaluateMatchAchievements(userId, matchId);
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      scoreEarned,
      isLastQuestion,
      unlockedAchievements,
    };
  }

  async getResult(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          where: { userId },
        },
        answers: {
          where: { userId },
          include: {
            question: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (match.mode !== MatchMode.PRACTICE) {
      throw new BadRequestException('Sesi ini bukan sesi latihan.');
    }

    if (match.matchPlayers.length === 0) {
      throw new BadRequestException('Anda tidak berpartisipasi dalam sesi ini.');
    }

    const playerStats = match.matchPlayers[0];

    // Let's order the answers according to the questionOrder field in match to match the playing progression
    const questionOrder = match.questionOrder as string[];
    const answersMap = new Map(match.answers.map((a) => [a.questionId, a]));

    const questionsWithUserAnswers = questionOrder.map((qId) => {
      const answer = answersMap.get(qId);
      if (!answer) return null;
      return {
        id: answer.question.id,
        questionText: answer.question.questionText,
        options: answer.question.options,
        correctAnswer: answer.question.correctAnswer,
        explanation: answer.question.explanation || '',
        difficulty: answer.question.difficulty,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        answerTimeMs: answer.answerTimeMs,
        scoreEarned: answer.scoreEarned,
      };
    }).filter(Boolean);

    const accuracy = match.totalQuestions > 0 ? (playerStats.correctCount / match.totalQuestions) * 100 : 0.0;

    return {
      matchId: match.id,
      totalScore: playerStats.totalScore,
      correctCount: playerStats.correctCount,
      wrongCount: playerStats.wrongCount,
      avgAnswerTime: playerStats.avgAnswerTime,
      accuracy: parseFloat(accuracy.toFixed(2)),
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      status: match.status,
      questions: questionsWithUserAnswers,
    };
  }
}
