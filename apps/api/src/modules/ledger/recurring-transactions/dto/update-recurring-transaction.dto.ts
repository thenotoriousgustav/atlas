import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export class UpdateRecurringTransactionDto {
  @ApiPropertyOptional({ example: 'Sewa Apartemen Bulanan', description: 'Transaction title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 3500000, description: 'Amount of money' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: ['EXPENSE', 'INCOME', 'TRANSFER'] })
  @IsEnum(['EXPENSE', 'INCOME', 'TRANSFER'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'MONTHLY', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z', description: 'Next date to post' })
  @IsDateString()
  @IsOptional()
  nextDate?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Source Account UUID' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', description: 'Category UUID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', description: 'Destination Account UUID (only for TRANSFER)' })
  @IsUUID()
  @IsOptional()
  transferAccountId?: string;
}
