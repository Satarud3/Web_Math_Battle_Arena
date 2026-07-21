import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameGateway } from '../game/game.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async sendFriendRequest(userId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!target) {
      throw new NotFoundException('Gladiator dengan username tersebut tidak ditemukan');
    }

    if (target.id === userId) {
      throw new BadRequestException('Anda tidak bisa mengirim permintaan pertemanan ke diri sendiri');
    }

    // Strict Bidirectional Database Check
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: target.id },
          { senderId: target.id, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('Anda sudah berteman dengan gladiator ini');
      }
      throw new BadRequestException('Permintaan pertemanan sudah pernah dikirim');
    }

    return this.prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: target.id,
        status: 'PENDING',
      },
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Permintaan pertemanan tidak ditemukan');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    // Notify both users of their live statuses
    if (GameGateway.instance) {
      const senderStatus = (await this.redisService.hget<string>('mba:user_status', updated.senderId)) || 'OFFLINE';
      const receiverStatus = (await this.redisService.hget<string>('mba:user_status', updated.receiverId)) || 'OFFLINE';

      const senderSocketId = await this.redisService.hget<string>('mba:user_sockets', updated.senderId);
      const receiverSocketId = await this.redisService.hget<string>('mba:user_sockets', updated.receiverId);

      if (receiverSocketId) {
        GameGateway.instance.server.to(receiverSocketId).emit('friend_status_change', {
          userId: updated.senderId,
          status: senderStatus,
        });
      }
      if (senderSocketId) {
        GameGateway.instance.server.to(senderSocketId).emit('friend_status_change', {
          userId: updated.receiverId,
          status: receiverStatus,
        });
      }
    }

    return updated;
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Permintaan pertemanan tidak ditemukan');
    }

    await this.prisma.friendship.delete({
      where: { id: requestId },
    });

    return { success: true };
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Hubungan pertemanan tidak ditemukan');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    // Notify both users that they are no longer friends (status becomes OFFLINE for each other)
    if (GameGateway.instance) {
      const senderSocketId = await this.redisService.hget<string>('mba:user_sockets', friendship.senderId);
      const receiverSocketId = await this.redisService.hget<string>('mba:user_sockets', friendship.receiverId);

      if (receiverSocketId) {
        GameGateway.instance.server.to(receiverSocketId).emit('friend_status_change', {
          userId: friendship.senderId,
          status: 'OFFLINE',
        });
      }
      if (senderSocketId) {
        GameGateway.instance.server.to(senderSocketId).emit('friend_status_change', {
          userId: friendship.receiverId,
          status: 'OFFLINE',
        });
      }
    }

    return { success: true };
  }

  async getFriendsList(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const userStatuses = await this.redisService.hgetall<string>('mba:user_status');

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      const status = userStatuses[friend.id] || 'OFFLINE';
      return {
        id: friend.id,
        name: friend.name,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        status,
        friendshipId: f.id,
      };
    });
  }
}
