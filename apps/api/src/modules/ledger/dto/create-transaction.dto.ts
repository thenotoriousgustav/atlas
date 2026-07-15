import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'EXPENSE', description: 'Transaction type', enum: ['EXPENSE', 'INCOME'] })
  @IsEnum(['EXPENSE', 'INCOME'])
  type: 'EXPENSE' | 'INCOME';

  @ApiProperty({ example: 12.5, description: 'Amount of transaction' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Coffee', description: 'Title of transaction' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Venti Latte at Starbucks', description: 'Description of transaction' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Food', description: 'Category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date' })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
