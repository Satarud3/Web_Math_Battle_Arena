import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Kategori ID tidak boleh kosong' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Teks soal tidak boleh kosong' })
  questionText: string;

  @IsOptional()
  options?: any;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsEnum(QuestionType, { message: 'Type harus berupa tipe soal yang valid' })
  @IsOptional()
  type?: QuestionType;

  @IsOptional()
  questionData?: any;

  @IsOptional()
  answerData?: any;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsEnum(Difficulty, { message: 'Difficulty harus berupa salah satu dari: EASY, MEDIUM, atau HARD' })
  difficulty: Difficulty;

  @IsInt({ message: 'Base score harus berupa bilangan bulat' })
  @Min(10, { message: 'Base score minimal bernilai 10' })
  baseScore: number;
}
