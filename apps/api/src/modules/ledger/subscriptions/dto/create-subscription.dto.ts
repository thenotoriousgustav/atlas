import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Netflix', description: 'Name of subscription' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15.99, description: 'Cost of subscription' })
  @IsNumber()
  cost: number;

  @ApiProperty({ example: 'MONTHLY', description: 'Billing cycle', enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsEnum(['WEEKLY', 'MONTHLY', 'YEARLY'])
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', description: 'Start date of subscription' })
  @IsISO8601()
  startDate: string;

  @ApiPropertyOptional({ example: 'Entertainment', description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Subscription status', enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] })
  @IsEnum(['ACTIVE', 'PAUSED', 'CANCELLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
}
