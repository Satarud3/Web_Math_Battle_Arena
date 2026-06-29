import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiCoachService } from './ai-coach.service';

@Controller('ai-coach')
@UseGuards(JwtAuthGuard)
export class AiCoachController {
  constructor(private readonly aiCoachService: AiCoachService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(@Request() req) {
    return this.aiCoachService.getDashboardData(req.user.id);
  }
}
