import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Difficulty, MatchMode, MatchStatus } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { checkAnswer, getCorrectAnswerString } from '../common/utils/answer';

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
        type: firstQuestion.type,
        questionData: firstQuestion.questionData,
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
        type: question.type,
        questionData: question.questionData,
        options: question.options,
        difficulty: question.difficulty,
        baseScore: question.baseScore,
      },
    };
  }

  async getDailyChallenges(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find challenges for today
    let challenges = await this.prisma.dailyChallenge.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { xpReward: 'asc' },
    });

    // Generate challenges if they don't exist
    if (challenges.length === 0) {
      challenges = await this.prisma.$transaction(async (tx) => {
        const c1 = await tx.dailyChallenge.create({
          data: {
            userId,
            title: 'Pemanasan Pagi',
            description: 'Selesaikan 1 sesi latihan dalam mode apa saja.',
            xpReward: 100,
          },
        });

        const c2 = await tx.dailyChallenge.create({
          data: {
            userId,
            title: 'Akurasi Tinggi',
            description: 'Selesaikan sesi latihan dengan akurasi minimal 80%.',
            xpReward: 150,
          },
        });

        const c3 = await tx.dailyChallenge.create({
          data: {
            userId,
            title: 'Kecepatan Kilat',
            description: 'Selesaikan sesi latihan dengan rata-rata waktu menjawab di bawah 6 detik.',
            xpReward: 200,
          },
        });

        return [c1, c2, c3];
      });
    }

    // Get current level & progress
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    const currentXp = stats?.xp || 0;
    const currentLevel = stats?.masteryLevel || 1;
    const currentStreak = stats?.currentStreak || 0;
    
    const xpInCurrentLevel = currentXp % 1000;
    const xpNeededForNextLevel = 1000;

    return {
      challenges,
      currentLevel,
      currentXp,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      currentStreak,
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

    // Dynamic Answer Checking
    const isCorrect = checkAnswer(question.type, dto.chosenOption, question);
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

        // Calculate Practice XP
        let matchXp = 0;
        const answersForXp = await tx.answer.findMany({
          where: { matchId, userId },
          include: { question: true },
        });

        for (const ans of answersForXp) {
          if (ans.isCorrect) {
            const diff = ans.question.difficulty;
            if (diff === Difficulty.EASY) matchXp += 10;
            else if (diff === Difficulty.MEDIUM) matchXp += 15;
            else if (diff === Difficulty.HARD) matchXp += 20;
          }
        }

        // Perfect score bonus
        const accuracy = match.totalQuestions > 0 ? (correctCount / match.totalQuestions) * 100 : 0.0;
        if (correctCount === match.totalQuestions) {
          matchXp += 50;
        }

        // Evaluate Daily Challenges for today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const dailyChallenges = await tx.dailyChallenge.findMany({
          where: {
            userId,
            isCompleted: false,
            createdAt: { gte: startOfToday, lte: endOfToday },
          },
        });

        let challengeXpBonus = 0;
        for (const challenge of dailyChallenges) {
          let completed = false;
          if (challenge.title === 'Pemanasan Pagi') {
            completed = true; // finishing this match completes it
          } else if (challenge.title === 'Akurasi Tinggi') {
            if (accuracy >= 80) completed = true;
          } else if (challenge.title === 'Kecepatan Kilat') {
            if (avgAnswerTime < 6000) completed = true; // average answer time under 6 seconds (6000ms)
          }

          if (completed) {
            await tx.dailyChallenge.update({
              where: { id: challenge.id },
              data: { isCompleted: true },
            });
            challengeXpBonus += challenge.xpReward;
          }
        }

        const totalSessionXp = matchXp + challengeXpBonus;

        // Update UserStats: totalQuestionsAnswered, totalCorrectAnswers, accuracy, XP, Mastery, Streaks
        const existingStats = await tx.userStats.findUnique({
          where: { userId },
        });

        if (existingStats) {
          const newTotalQuestions = existingStats.totalQuestionsAnswered + match.totalQuestions;
          const newTotalCorrect = existingStats.totalCorrectAnswers + correctCount;
          const newAccuracy = newTotalQuestions > 0 ? (newTotalCorrect / newTotalQuestions) * 100 : 0.0;

          // Streak Logic
          let newStreak = 1;
          const lastPractice = existingStats.lastPracticeAt ? new Date(existingStats.lastPracticeAt) : null;
          const now = new Date();

          if (lastPractice) {
            const oneDayInMs = 24 * 60 * 60 * 1000;
            const diffInMs = now.getTime() - lastPractice.getTime();
            
            const isSameDay = now.toDateString() === lastPractice.toDateString();
            const isNextDay = new Date(now.getTime() - oneDayInMs).toDateString() === lastPractice.toDateString() || (diffInMs > 12 * 60 * 60 * 1000 && diffInMs <= 36 * 60 * 60 * 1000);

            if (isSameDay) {
              newStreak = existingStats.currentStreak;
            } else if (isNextDay) {
              newStreak = existingStats.currentStreak + 1;
            } else {
              newStreak = 1;
            }
          }

          const highestStreak = Math.max(existingStats.highestStreak, newStreak);
          const currentTotalXp = existingStats.xp + totalSessionXp;
          const newMasteryLevel = Math.floor(currentTotalXp / 1000) + 1;

          await tx.userStats.update({
            where: { userId },
            data: {
              totalQuestionsAnswered: newTotalQuestions,
              totalCorrectAnswers: newTotalCorrect,
              accuracy: parseFloat(newAccuracy.toFixed(2)),
              xp: currentTotalXp,
              masteryLevel: newMasteryLevel,
              currentStreak: newStreak,
              highestStreak,
              lastPracticeAt: now,
            },
          });
        } else {
          const acc = match.totalQuestions > 0 ? (correctCount / match.totalQuestions) * 105 : 0.0; // fix typo/accuracy scale
          const currentTotalXp = totalSessionXp;
          const newMasteryLevel = Math.floor(currentTotalXp / 1000) + 1;

          await tx.userStats.create({
            data: {
              userId,
              totalQuestionsAnswered: match.totalQuestions,
              totalCorrectAnswers: correctCount,
              accuracy: parseFloat(Math.min(100, acc).toFixed(2)),
              xp: currentTotalXp,
              masteryLevel: newMasteryLevel,
              currentStreak: 1,
              highestStreak: 1,
              lastPracticeAt: new Date(),
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
      correctAnswer: getCorrectAnswerString(question),
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
            question: {
              include: {
                category: true,
              },
            },
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

    // Order answers according to the questionOrder field in match to match the playing progression
    const questionOrder = match.questionOrder as string[];
    const answersMap = new Map(match.answers.map((a) => [a.questionId, a]));

    const questionsWithUserAnswers = questionOrder.map((qId) => {
      const answer = answersMap.get(qId);
      if (!answer) return null;
      return {
        id: answer.question.id,
        questionText: answer.question.questionText,
        type: answer.question.type,
        questionData: answer.question.questionData,
        options: answer.question.questionData || answer.question.options,
        correctAnswer: getCorrectAnswerString(answer.question),
        explanation: answer.question.explanation || '',
        difficulty: answer.question.difficulty,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        answerTimeMs: answer.answerTimeMs,
        scoreEarned: answer.scoreEarned,
      };
    }).filter(Boolean);

    const accuracy = match.totalQuestions > 0 ? (playerStats.correctCount / match.totalQuestions) * 100 : 0.0;

    // Calculate XP earned from this match
    let matchXp = 0;
    for (const ans of match.answers) {
      if (ans.isCorrect) {
        const diff = ans.question.difficulty;
        if (diff === Difficulty.EASY) matchXp += 10;
        else if (diff === Difficulty.MEDIUM) matchXp += 15;
        else if (diff === Difficulty.HARD) matchXp += 20;
      }
    }
    if (playerStats.correctCount === match.totalQuestions) {
      matchXp += 50; // Perfect score bonus
    }

    // Determine if any daily challenges were completed in this session
    // We check if the challenges were completed today and the session met the criteria
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const completedChallengesToday = await this.prisma.dailyChallenge.findMany({
      where: {
        userId,
        isCompleted: true,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    let challengeXpBonus = 0;
    const completedInThisSession: string[] = [];

    for (const challenge of completedChallengesToday) {
      let completedInMatch = false;
      if (challenge.title === 'Pemanasan Pagi') {
        completedInMatch = true; // completing this match completes the first practice challenge
      } else if (challenge.title === 'Akurasi Tinggi') {
        if (accuracy >= 80) completedInMatch = true;
      } else if (challenge.title === 'Kecepatan Kilat') {
        if (Number(playerStats.avgAnswerTime) < 6000) completedInMatch = true;
      }

      if (completedInMatch) {
        challengeXpBonus += challenge.xpReward;
        completedInThisSession.push(challenge.title);
      }
    }

    const totalXpEarned = matchXp + challengeXpBonus;

    // Calculate Mastery Level Info
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    const currentXp = stats?.xp || 0;
    const currentLevel = stats?.masteryLevel || 1;
    const xpBeforeMatch = Math.max(0, currentXp - totalXpEarned);
    const levelBeforeMatch = Math.floor(xpBeforeMatch / 1000) + 1;
    const masteryIncreased = currentLevel > levelBeforeMatch;

    // Calculate Best Combo (consecutive correct answers)
    let bestCombo = 0;
    let currentCombo = 0;
    for (const qId of questionOrder) {
      const ans = answersMap.get(qId);
      if (ans && ans.isCorrect) {
        currentCombo++;
        if (currentCombo > bestCombo) {
          bestCombo = currentCombo;
        }
      } else {
        currentCombo = 0;
      }
    }

    // Determine strongest category (category with the most correct answers)
    const categoryScores: { [key: string]: { correct: number; total: number } } = {};
    for (const ans of match.answers) {
      const catName = ans.question.category.name;
      if (!categoryScores[catName]) {
        categoryScores[catName] = { correct: 0, total: 0 };
      }
      categoryScores[catName].total++;
      if (ans.isCorrect) {
        categoryScores[catName].correct++;
      }
    }

    let strongestCategory = 'N/A';
    let maxAccuracy = -1;
    for (const catName of Object.keys(categoryScores)) {
      const catAcc = categoryScores[catName].correct / categoryScores[catName].total;
      if (catAcc > maxAccuracy) {
        maxAccuracy = catAcc;
        strongestCategory = catName;
      }
    }

    return {
      matchId: match.id,
      totalScore: playerStats.totalScore,
      correctCount: playerStats.correctCount,
      wrongCount: playerStats.wrongCount,
      avgAnswerTime: Number(playerStats.avgAnswerTime),
      accuracy: parseFloat(accuracy.toFixed(2)),
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      status: match.status,
      questions: questionsWithUserAnswers,
      xpEarned: totalXpEarned,
      masteryIncreased,
      currentLevel,
      nextLevelProgress: currentXp % 1000,
      bestCombo,
      strongestCategory,
      completedChallenges: completedInThisSession,
    };
  }
}
