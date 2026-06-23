import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.usersService.getStats(req.user.id);
  }

  @Get('matches/recent')
  getRecentMatches(@Request() req) {
    return this.usersService.getRecentMatches(req.user.id);
  }

  @Get(':username/profile')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get(':id/match-history')
  getMatchHistory(@Param('id') userId: string) {
    return this.usersService.getMatchHistory(userId);
  }
}
