import { IsString, IsNotEmpty, IsIn, IsInt, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty({ message: 'Jawaban tidak boleh kosong' })
  chosenOption: string;

  @IsInt()
  @IsOptional()
  answerTimeMs?: number = 0;
}
