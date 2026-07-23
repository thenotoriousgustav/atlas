import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class LogHabitEntryDto {
  @ApiProperty({ example: '2026-07-24', description: 'YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: 1800, description: 'Duration in seconds' })
  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 'Ran 5km at the park' })
  @IsString()
  @IsOptional()
  note?: string;
}
