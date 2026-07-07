import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus, RoleName } from '@prisma/client';

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

  async getUsers(search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    return {
      total,
      page,
      limit,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        role: u.role.name,
      })),
    };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async updateUserRole(userId: string, roleName: RoleName) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      throw new BadRequestException('Role tidak valid.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User berhasil dihapus.' };
  }
}
