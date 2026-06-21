import { Module, forwardRef } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { MatchmakingService } from './matchmaking.service';
import { RoomService } from './room.service';
import { GameController } from './game.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [GameController],
  providers: [GameGateway, MatchmakingService, RoomService],
  exports: [GameGateway, MatchmakingService, RoomService],
})
export class GameModule {}
