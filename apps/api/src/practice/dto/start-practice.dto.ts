import { IsString, IsOptional, IsEnum, IsInt, IsIn } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class StartPracticeDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(Difficulty, { message: 'Difficulty harus berupa salah satu dari: EASY, MEDIUM, atau HARD' })
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @IsIn([5, 10, 20], { message: 'Jumlah soal harus bernilai 5, 10, atau 20' })
  @IsOptional()
  totalQuestions?: number = 10;
}
