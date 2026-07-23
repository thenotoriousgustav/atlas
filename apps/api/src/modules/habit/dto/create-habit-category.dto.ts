import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateHabitCategoryDto {
  @ApiProperty({ example: 'Health' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'emerald' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'FolderSimple' })
  @IsString()
  @IsOptional()
  icon?: string;
}
