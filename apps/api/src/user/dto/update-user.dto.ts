import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Gustam', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'admin@gustam.dev', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'https://avatar.url', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
