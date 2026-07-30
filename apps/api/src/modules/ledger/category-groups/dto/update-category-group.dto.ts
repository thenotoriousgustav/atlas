import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCategoryGroupDto {
  @ApiPropertyOptional({ example: 'Kebutuhan Harian', description: 'Category group name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sorting order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: false, description: 'Is hidden' })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
}
