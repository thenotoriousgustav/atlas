import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ example: 'Emergency Fund', description: 'Goal name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'EMERGENCY_FUND',
    description: 'Goal type',
    enum: ['EMERGENCY_FUND', 'VACATION', 'HOUSE', 'CAR', 'WEDDING', 'RETIREMENT', 'DEBT_PAYOFF', 'CUSTOM'],
  })
  @IsString()
  type: string;

  @ApiProperty({ example: 10000000, description: 'Target amount in currency' })
  @IsNumber()
  targetAmount: number;

  @ApiPropertyOptional({ example: 2500000, description: 'Current saved amount' })
  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @ApiPropertyOptional({ example: 500000, description: 'Monthly contribution target' })
  @IsNumber()
  @IsOptional()
  monthlyContribution?: number;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Target completion date' })
  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional({ example: 'Shield', description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#346538', description: 'Color theme hex' })
  @IsString()
  @IsOptional()
  color?: string;
}
