import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
