import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getTier } from '../common/utils/tier';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalLeaderboard(currentUserId: string | null) {
    // 1. Get Top 100 rankings sorted by ratingPoint DESC
    const top100 = await this.prisma.ranking.findMany({
      orderBy: {
        ratingPoint: 'desc',
      },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 2. Map and compute rank with ties handled correctly
    let currentRank = 1;
    const results: any[] = [];
    for (let i = 0; i < top100.length; i++) {
      const rp = Number(top100[i].ratingPoint);
      if (i > 0 && rp < Number(top100[i - 1].ratingPoint)) {
        currentRank = i + 1;
      }
      results.push({
        id: top100[i].id,
        userId: top100[i].userId,
        ratingPoint: rp,
        tier: getTier(rp),
        rank: currentRank,
        username: top100[i].user.username,
        name: top100[i].user.name,
        avatarUrl: top100[i].user.avatarUrl,
        isCurrentUser: top100[i].userId === currentUserId,
      });
    }

    // 3. Check if current user is in the list
    const isCurrentUserInTop100 = results.some((r) => r.userId === currentUserId);

    if (!isCurrentUserInTop100 && currentUserId) {
      // Fetch current user's ranking
      const currentUserRanking = await this.prisma.ranking.findUnique({
        where: { userId: currentUserId },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (currentUserRanking) {
        const rp = Number(currentUserRanking.ratingPoint);
        // Calculate exact rank by counting players with higher ratingPoint
        const countHigher = await this.prisma.ranking.count({
          where: {
            ratingPoint: {
              gt: rp,
            },
          },
        });
        const rank = countHigher + 1;

        results.push({
          id: currentUserRanking.id,
          userId: currentUserRanking.userId,
          ratingPoint: rp,
          tier: getTier(rp),
          rank,
          username: currentUserRanking.user.username,
          name: currentUserRanking.user.name,
          avatarUrl: currentUserRanking.user.avatarUrl,
          isCurrentUser: true,
        });
      }
    }

    return results;
  }
}
