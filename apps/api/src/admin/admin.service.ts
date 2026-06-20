import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalQuestions, totalActiveMatches] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.question.count(),
      this.prisma.match.count({
        where: { status: MatchStatus.ACTIVE },
      }),
    ]);

    return {
      totalUsers,
      totalQuestions,
      totalActiveMatches,
    };
  }

  async getRecentUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      role: u.role.name,
    }));
  }

  async getRecentMatches() {
    return this.prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        matchPlayers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }
}
