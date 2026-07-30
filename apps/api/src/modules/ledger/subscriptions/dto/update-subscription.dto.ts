import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'Netflix', description: 'Name of subscription' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 15.99, description: 'Cost of subscription' })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 'MONTHLY', description: 'Billing cycle', enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsEnum(['WEEKLY', 'MONTHLY', 'YEARLY'])
  @IsOptional()
  billingCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z', description: 'Start date of subscription' })
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: 'Entertainment', description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Subscription status', enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] })
  @IsEnum(['ACTIVE', 'PAUSED', 'CANCELLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
}
