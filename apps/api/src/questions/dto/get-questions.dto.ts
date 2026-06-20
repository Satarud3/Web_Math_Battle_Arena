import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class GetQuestionsDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(Difficulty, { message: 'Difficulty harus berupa salah satu dari: EASY, MEDIUM, atau HARD' })
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
