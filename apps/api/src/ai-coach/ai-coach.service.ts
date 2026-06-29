import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiCoachService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    // 1. Cold Start Check: check if the user has 0 answers and 0 matches
    const totalAnswersCount = await this.prisma.answer.count({
      where: { userId },
    });

    const totalMatchesCount = await this.prisma.matchPlayer.count({
      where: { userId },
    });

    if (totalAnswersCount === 0 && totalMatchesCount === 0) {
      return {
        recentImprovement: 'Sistem analitis siap! Mainkan minimal 3 duel untuk membuka kalkulasi siber.',
        weakestCategory: 'Belum Ada Data',
        mostImprovedCategory: 'Belum Ada Data',
        recommendedTrainingId: null,
        estimatedWinRate: 50.0,
        projectedRank: 'Silver I',
      };
    }

    // 2. Weakest and Strongest Categories based on last 100 answers (Performance Guard)
    const answers = await this.prisma.answer.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      take: 100,
      include: {
        question: {
          include: {
            category: true,
          },
        },
      },
    });

    let weakestCategory = 'Belum Ada Data';
    let mostImprovedCategory = 'Belum Ada Data';
    let recommendedTrainingId: string | null = null;

    if (answers.length > 0) {
      const categoryStats: Record<
        string,
        { id: string; name: string; correct: number; total: number }
      > = {};

      for (const ans of answers) {
        const cat = ans.question?.category;
        if (!cat) continue;

        if (!categoryStats[cat.id]) {
          categoryStats[cat.id] = {
            id: cat.id,
            name: cat.name,
            correct: 0,
            total: 0,
          };
        }
        categoryStats[cat.id].total++;
        if (ans.isCorrect) {
          categoryStats[cat.id].correct++;
        }
      }

      const statsArray = Object.values(categoryStats).map((stat) => ({
        ...stat,
        accuracy: (stat.correct / stat.total) * 100,
      }));

      if (statsArray.length > 0) {
        // Sort by accuracy ascending
        statsArray.sort((a, b) => a.accuracy - b.accuracy);
        
        weakestCategory = statsArray[0].name;
        recommendedTrainingId = statsArray[0].id;

        // Strongest category (highest accuracy)
        mostImprovedCategory = statsArray[statsArray.length - 1].name;
      }
    }

    // 3. Win Rate Estimation from last 10 matches
    const recentMatches = await this.prisma.matchPlayer.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    let recentWinRate = 0.5;
    if (recentMatches.length > 0) {
      const wins = recentMatches.filter((m) => m.result === 'WIN').length;
      recentWinRate = wins / recentMatches.length;
    }

    // Combine recent win rate with overall training accuracy for robustness
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });
    const overallAccuracy = userStats ? Number(userStats.accuracy) / 100 : 0.5;
    const estimatedWinRate = Math.round(((recentWinRate * 0.6) + (overallAccuracy * 0.4)) * 1000) / 10;

    // 4. Clamped MMR Projection (30 Days)
    const ranking = await this.prisma.ranking.findUnique({
      where: { userId },
    });
    const currentMMR = ranking ? ranking.ratingPoint : 1000;

    // Net MMR velocity per match: Win gets +25 RP, Loss gets -10 RP
    const expectedMMRChangePerMatch = (recentWinRate * 25) + ((1 - recentWinRate) * -10);
    
    // Assume average 30 matches in 30 days
    const projectedMMRChange = Math.round(expectedMMRChangePerMatch * 30);
    
    // Clamp projected MMR between 100 (minimum) and 3000 (maximum)
    const projectedMMR = Math.max(100, Math.min(3000, currentMMR + projectedMMRChange));
    const projectedRank = this.getDetailedRank(projectedMMR);

    // 5. Dynamic Recent Improvement statement
    let recentImprovement = 'Analisis selesai. Pertahankan fokus latihan Anda!';
    if (userStats && userStats.highestStreak >= 3) {
      recentImprovement = `Anda memegang rekor streak tertinggi ${userStats.highestStreak}x jawaban benar!`;
    }
    if (answers.length >= 5) {
      const correctLast5 = answers.slice(0, 5).filter(a => a.isCorrect).length;
      if (correctLast5 >= 4) {
        recentImprovement = 'Performa luar biasa! Akurasi Anda mencapai 80%+ dalam 5 soal terakhir.';
      }
    }

    return {
      recentImprovement,
      weakestCategory,
      mostImprovedCategory,
      recommendedTrainingId,
      estimatedWinRate,
      projectedRank,
    };
  }

  private getDetailedRank(mmr: number): string {
    if (mmr < 1000) {
      if (mmr < 600) return 'Bronze III';
      if (mmr < 800) return 'Bronze II';
      return 'Bronze I';
    }
    if (mmr < 1500) {
      if (mmr < 1166) return 'Silver III';
      if (mmr < 1333) return 'Silver II';
      return 'Silver I';
    }
    if (mmr < 2000) {
      if (mmr < 1666) return 'Gold III';
      if (mmr < 1833) return 'Gold II';
      return 'Gold I';
    }
    if (mmr < 2500) {
      if (mmr < 2166) return 'Platinum III';
      if (mmr < 2333) return 'Platinum II';
      return 'Platinum I';
    }
    return 'Master';
  }
}
