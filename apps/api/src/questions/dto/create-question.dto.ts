import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Kategori ID tidak boleh kosong' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Teks soal tidak boleh kosong' })
  questionText: string;

  @IsString()
  @IsNotEmpty({ message: 'Pilihan A tidak boleh kosong' })
  optionA: string;

  @IsString()
  @IsNotEmpty({ message: 'Pilihan B tidak boleh kosong' })
  optionB: string;

  @IsString()
  @IsNotEmpty({ message: 'Pilihan C tidak boleh kosong' })
  optionC: string;

  @IsString()
  @IsNotEmpty({ message: 'Pilihan D tidak boleh kosong' })
  optionD: string;

  @IsString()
  @IsNotEmpty({ message: 'Jawaban benar tidak boleh kosong' })
  @IsIn(['A', 'B', 'C', 'D'], { message: 'Jawaban benar harus berupa salah satu dari: A, B, C, atau D' })
  correctAnswer: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsEnum(Difficulty, { message: 'Difficulty harus berupa salah satu dari: EASY, MEDIUM, atau HARD' })
  difficulty: Difficulty;

  @IsInt({ message: 'Base score harus berupa bilangan bulat' })
  @Min(10, { message: 'Base score minimal bernilai 10' })
  baseScore: number;
}
