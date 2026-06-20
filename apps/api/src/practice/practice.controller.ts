import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PracticeService } from './practice.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startPractice(@Body() dto: StartPracticeDto, @Request() req) {
    return this.practiceService.startPractice(req.user.id, dto);
  }

  @Get(':matchId/current')
  @HttpCode(HttpStatus.OK)
  async getCurrentQuestion(@Param('matchId') matchId: string, @Request() req) {
    return this.practiceService.getCurrentQuestion(matchId, req.user.id);
  }

  @Post(':matchId/submit')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitAnswerDto,
    @Request() req,
  ) {
    return this.practiceService.submitAnswer(matchId, req.user.id, dto);
  }

  @Get(':matchId/result')
  @HttpCode(HttpStatus.OK)
  async getResult(@Param('matchId') matchId: string, @Request() req) {
    return this.practiceService.getResult(matchId, req.user.id);
  }
}
