import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { MatchesModule } from './matches/matches.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { GameModule } from './game/game.module';
import { AdminModule } from './admin/admin.module';
import { PracticeModule } from './practice/practice.module';
import { AchievementsModule } from './achievements/achievements.module';
import { AiCoachModule } from './ai-coach/ai-coach.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    QuestionsModule,
    MatchesModule,
    LeaderboardModule,
    GameModule,
    AdminModule,
    PracticeModule,
    AchievementsModule,
    AiCoachModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
