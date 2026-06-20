import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
