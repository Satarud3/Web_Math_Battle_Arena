import { Module, forwardRef } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { MatchmakingService } from './matchmaking.service';
import { RoomService } from './room.service';
import { GameController } from './game.controller';
import { AuthModule } from '../auth/auth.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [forwardRef(() => AuthModule), AchievementsModule],
  controllers: [GameController],
  providers: [GameGateway, MatchmakingService, RoomService],
  exports: [GameGateway, MatchmakingService, RoomService],
})
export class GameModule {}
