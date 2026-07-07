import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class UpdateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Kategori ID tidak boleh kosong' })
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Teks soal tidak boleh kosong' })
  @IsOptional()
  questionText?: string;

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
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt({ message: 'Base score harus berupa bilangan bulat' })
  @Min(10, { message: 'Base score minimal bernilai 10' })
  @IsOptional()
  baseScore?: number;

  @IsOptional()
  isActive?: boolean;
}
