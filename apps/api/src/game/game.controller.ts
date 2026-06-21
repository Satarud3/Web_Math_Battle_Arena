import { Controller, Get, Param, UseGuards, Request, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MatchMode } from '@prisma/client';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('duel/:matchId/result')
  async getDuelResult(@Param('matchId') matchId: string, @Request() req) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          include: {
            user: true,
          },
        },
        leaderboardLogs: {
          include: {
            ranking: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Pertandingan tidak ditemukan.');
    }

    if (match.mode !== MatchMode.DUEL) {
      throw new BadRequestException('Sesi ini bukan pertandingan duel 1v1.');
    }

    // Verify requesting player participated in this match
    const isParticipant = match.matchPlayers.some((mp) => mp.userId === req.user.id);
    if (!isParticipant) {
      throw new BadRequestException('Anda tidak berpartisipasi dalam pertandingan ini.');
    }

    const playersResult = match.matchPlayers.map((mp) => {
      const log = match.leaderboardLogs.find((l) => l.ranking.userId === mp.userId);
      return {
        userId: mp.userId,
        username: mp.user.username,
        name: mp.user.name,
        totalScore: mp.totalScore,
        correctCount: mp.correctCount,
        wrongCount: mp.wrongCount,
        avgAnswerTime: Number(mp.avgAnswerTime),
        result: mp.result,
        mmrChange: log ? log.changePoint : 0,
      };
    });

    return {
      matchId: match.id,
      winnerUserId: match.winnerUserId,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      players: playersResult,
    };
  }
}
