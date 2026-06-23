import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getTier } from '../common/utils/tier';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
    };
  }

  async getStats(userId: string) {
    const stats = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userStats: true,
        ranking: true,
      },
    });

    if (!stats) {
      throw new NotFoundException('User stats tidak ditemukan');
    }

    let currentRank: number | null = null;
    let ranking: any = null;

    if (stats.ranking) {
      // Calculate rank dynamically based on ratingPoint > currentRatingPoint + 1
      const countHigher = await this.prisma.ranking.count({
        where: {
          ratingPoint: {
            gt: stats.ranking.ratingPoint,
          },
        },
      });
      currentRank = countHigher + 1;
      ranking = {
        ...stats.ranking,
        currentRank,
      };
    }

    return {
      userStats: stats.userStats || null,
      ranking,
    };
  }

  async getRecentMatches(userId: string) {
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      take: 5,
      include: {
        match: {
          include: {
            matchPlayers: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!matchPlayers || matchPlayers.length === 0) {
      return [];
    }

    return matchPlayers.map((mp) => ({
      id: mp.id,
      matchId: mp.matchId,
      mode: mp.match.mode,
      status: mp.match.status,
      totalScore: mp.totalScore,
      correctCount: mp.correctCount,
      wrongCount: mp.wrongCount,
      avgAnswerTime: mp.avgAnswerTime,
      result: mp.result,
      joinedAt: mp.joinedAt,
      match: {
        id: mp.match.id,
        mode: mp.match.mode,
        status: mp.match.status,
        totalQuestions: mp.match.totalQuestions,
        winnerUserId: mp.match.winnerUserId,
        createdAt: mp.match.createdAt,
        endedAt: mp.match.endedAt,
        matchPlayers: mp.match.matchPlayers.map((p) => ({
          userId: p.userId,
          totalScore: p.totalScore,
          result: p.result,
          user: {
            id: p.user.id,
            name: p.user.name,
            username: p.user.username,
            avatarUrl: p.user.avatarUrl,
          },
        })),
      },
    }));
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        userStats: true,
        ranking: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    let currentRank: number | null = null;
    if (user.ranking) {
      const countHigher = await this.prisma.ranking.count({
        where: {
          ratingPoint: {
            gt: Number(user.ranking.ratingPoint),
          },
        },
      });
      currentRank = countHigher + 1;
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      role: user.role.name,
      userStats: user.userStats || null,
      ranking: user.ranking ? {
        ratingPoint: Number(user.ranking.ratingPoint),
        tier: getTier(Number(user.ranking.ratingPoint)),
        currentRank,
      } : null,
    };
  }

  async getMatchHistory(userId: string) {
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: {
        match: {
          include: {
            matchPlayers: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    return matchPlayers.map((mp) => {
      const opponent = mp.match.matchPlayers.find((p) => p.userId !== userId);
      return {
        matchId: mp.matchId,
        mode: mp.match.mode,
        status: mp.match.status,
        totalScore: mp.totalScore,
        correctCount: mp.correctCount,
        wrongCount: mp.wrongCount,
        avgAnswerTime: Number(mp.avgAnswerTime),
        result: mp.result,
        playedAt: mp.joinedAt,
        opponent: opponent
          ? {
              id: opponent.user.id,
              name: opponent.user.name,
              username: opponent.user.username,
              avatarUrl: opponent.user.avatarUrl,
              totalScore: opponent.totalScore,
              result: opponent.result,
            }
          : null,
      };
    });
  }
}
