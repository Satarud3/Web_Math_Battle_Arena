import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users/recent')
  getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  @Get('matches/recent')
  getRecentMatches() {
    return this.adminService.getRecentMatches();
  }

  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getUsers(search, p, l);
  }

  @Patch('users/:userId/status')
  toggleUserStatus(@Param('userId') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  @Patch('users/:userId/role')
  updateUserRole(@Param('userId') userId: string, @Body('role') role: RoleName) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Delete('users/:userId')
  deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}
