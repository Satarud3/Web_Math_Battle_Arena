import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  async sendRequest(@Body('targetUsername') targetUsername: string, @Request() req) {
    return this.friendsService.sendFriendRequest(req.user.id, targetUsername);
  }

  @Get('pending')
  async getPending(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Patch('accept/:requestId')
  async acceptRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.friendsService.acceptFriendRequest(req.user.id, requestId);
  }

  @Delete('remove/:friendId')
  async removeFriend(@Param('friendId') friendId: string, @Request() req) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  @Get('list')
  async getFriends(@Request() req) {
    return this.friendsService.getFriendsList(req.user.id);
  }
}
