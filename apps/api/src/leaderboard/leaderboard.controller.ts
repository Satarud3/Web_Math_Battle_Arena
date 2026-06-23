import { Controller, Get, Request } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('global')
  getGlobalLeaderboard(@Request() req) {
    let currentUserId: string | null = null;
    const cookiesHeader = req.headers.cookie;

    if (cookiesHeader) {
      try {
        const cookies = cookie.parse(cookiesHeader);
        const token = cookies['access_token'];
        if (token) {
          const payload = this.jwtService.verify(token);
          currentUserId = payload.sub || payload.id;
        }
      } catch (err) {
        // Ignore JWT verification errors for the public endpoint
      }
    }

    return this.leaderboardService.getGlobalLeaderboard(currentUserId);
  }
}
