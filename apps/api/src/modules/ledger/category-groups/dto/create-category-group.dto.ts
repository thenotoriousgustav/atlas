import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryGroupDto {
  @ApiProperty({ example: 'Kebutuhan Harian', description: 'Category group name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 0, description: 'Sorting order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
