import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 20, { message: 'Username harus di antara 3 sampai 20 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username hanya boleh berisi huruf, angka, dan underscore' })
  username?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
