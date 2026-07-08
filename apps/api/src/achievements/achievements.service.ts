import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateMatchAchievements(userId: string, matchId: string) {
    const newlyUnlocked: any[] = [];

    // Get all achievements the user has already unlocked
    const alreadyUnlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(alreadyUnlocked.map((ua) => ua.achievementId));

    // Get all system achievements
    const allAchievements = await this.prisma.achievement.findMany();

    // Find locked achievements
    const lockedAchievements = allAchievements.filter((a) => !unlockedIds.has(a.id));

    if (lockedAchievements.length === 0) {
      return [];
    }

    // Fetch required match and user stats data
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          where: { userId },
        },
      },
    });

    if (!match || match.matchPlayers.length === 0) {
      return [];
    }

    const playerMatchStats = match.matchPlayers[0];
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    // Pre-fetch player's answers in this match once to avoid N+1 queries in loops
    const playerAnswers = await this.prisma.answer.findMany({
      where: { matchId, userId },
    });

    for (const ach of lockedAchievements) {
      let satisfies = false;

      switch (ach.code) {
        case 'FIRST_BLOOD': {
          // Memenangkan duel 1v1 pertamamu
          if (match.mode === 'DUEL' && playerMatchStats.result === 'WIN') {
            satisfies = true;
          }
          break;
        }
        case 'FLAWLESS_VICTORY': {
          // Mencapai Akurasi 100% dalam satu sesi duel
          if (
            match.mode === 'DUEL' &&
            playerMatchStats.correctCount > 0 &&
            playerMatchStats.wrongCount === 0
          ) {
            satisfies = true;
          }
          break;
        }
        case 'ASSASSIN_INSTINCT': {
          // Menjawab soal dengan benar dalam waktu kurang dari 3 detik
          const fastCorrectAnswer = playerAnswers.find(
            (ans) => ans.isCorrect && ans.answerTimeMs < 3000,
          );
          if (fastCorrectAnswer) {
            satisfies = true;
          }
          break;
        }
        case 'UNSTOPPABLE': {
          // Mencapai Win Streak 5 kali berturut-turut (diambil dari UserStats)
          if (userStats && userStats.currentStreak >= 5) {
            satisfies = true;
          }
          break;
        }
        case 'SCHOLAR': {
          // Menyelesaikan total 50 pertandingan (Practice/Duel)
          if (userStats && userStats.totalMatches >= 50) {
            satisfies = true;
          }
          break;
        }
      }

      if (satisfies) {
        // Unlock it in database
        unlockedIds.add(ach.id);
        const unlockedAchievement = await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
          include: {
            achievement: true,
          },
        });
        newlyUnlocked.push(unlockedAchievement.achievement);
      }
    }

    return newlyUnlocked;
  }

  async getMyAchievements(userId: string) {
    const allAchievements = await this.prisma.achievement.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const userAchievementsMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return allAchievements.map((ach) => {
      const isUnlocked = userAchievementsMap.has(ach.id);
      return {
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        requirementType: ach.requirementType,
        requirementValue: ach.requirementValue,
        rewardPoint: ach.rewardPoint,
        isUnlocked,
        unlockedAt: isUnlocked ? userAchievementsMap.get(ach.id) : null,
      };
    });
  }
}
