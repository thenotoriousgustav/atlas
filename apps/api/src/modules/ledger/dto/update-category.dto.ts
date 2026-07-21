import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Makanan & Minuman', description: 'Category name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Category Group UUID' })
  @IsUUID()
  @IsOptional()
  categoryGroupId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sorting order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: false, description: 'Is hidden' })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ example: 500000, description: 'Target savings amount' })
  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @ApiPropertyOptional({ example: 'MONTHLY_SPENDING', description: 'Target type' })
  @IsString()
  @IsOptional()
  targetType?: string;

  @ApiPropertyOptional({ example: 12, description: 'Target month' })
  @IsNumber()
  @IsOptional()
  targetMonth?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Target year' })
  @IsNumber()
  @IsOptional()
  targetYear?: number;
}
