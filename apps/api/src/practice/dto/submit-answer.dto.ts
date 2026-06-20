import { IsString, IsNotEmpty, IsIn, IsInt, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty({ message: 'Jawaban tidak boleh kosong' })
  @IsIn(['A', 'B', 'C', 'D'], { message: 'Jawaban harus berupa salah satu dari: A, B, C, atau D' })
  chosenOption: string;

  @IsInt()
  @IsOptional()
  answerTimeMs?: number = 0;
}
