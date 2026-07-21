import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsISO8601, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'EXPENSE', description: 'Transaction type', enum: ['EXPENSE', 'INCOME', 'TRANSFER'] })
  @IsEnum(['EXPENSE', 'INCOME', 'TRANSFER'])
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';

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

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Account UUID' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', description: 'Category UUID (optional for income/transfers)' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', description: 'Transfer Destination Account UUID' })
  @IsUUID()
  @IsOptional()
  transferAccountId?: string;

  @ApiPropertyOptional({ example: 'Food', description: 'Deprecated free-text category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date' })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
