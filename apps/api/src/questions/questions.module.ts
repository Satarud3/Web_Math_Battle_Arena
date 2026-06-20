import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  controllers: [CategoriesController, QuestionsController],
  providers: [CategoriesService, QuestionsService],
  exports: [CategoriesService, QuestionsService],
})
export class QuestionsModule {}
