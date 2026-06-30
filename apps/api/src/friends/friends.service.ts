import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameGateway } from '../game/game.gateway';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

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
      } else {
        throw new BadRequestException('Permintaan pertemanan sudah dikirim sebelumnya dan sedang menunggu respon');
      }
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
      const senderStatus = GameGateway.userStatus.get(updated.senderId) || 'OFFLINE';
      const receiverStatus = GameGateway.userStatus.get(updated.receiverId) || 'OFFLINE';

      const senderSocketId = GameGateway.userSockets.get(updated.senderId);
      const receiverSocketId = GameGateway.userSockets.get(updated.receiverId);

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

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
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
      const senderSocketId = GameGateway.userSockets.get(friendship.senderId);
      const receiverSocketId = GameGateway.userSockets.get(friendship.receiverId);

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

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      const status = GameGateway.userStatus.get(friend.id) || 'OFFLINE';
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
