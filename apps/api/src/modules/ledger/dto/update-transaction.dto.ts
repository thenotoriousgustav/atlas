import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'EXPENSE', description: 'Transaction type', enum: ['EXPENSE', 'INCOME'] })
  @IsEnum(['EXPENSE', 'INCOME'])
  @IsOptional()
  type?: 'EXPENSE' | 'INCOME';

  @ApiPropertyOptional({ example: 12.5, description: 'Amount of transaction' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'Coffee', description: 'Title of transaction' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Venti Latte at Starbucks', description: 'Description of transaction' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Food', description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date' })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
