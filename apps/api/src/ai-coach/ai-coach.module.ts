import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiCoachService } from './ai-coach.service';
import { AiCoachController } from './ai-coach.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiCoachController],
  providers: [AiCoachService],
  exports: [AiCoachService],
})
export class AiCoachModule {}
