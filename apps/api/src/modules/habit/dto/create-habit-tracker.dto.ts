import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum HabitType {
  BOOLEAN = 'BOOLEAN',
  COUNT = 'COUNT',
  DURATION = 'DURATION',
  NUMERIC = 'NUMERIC',
  AMOUNT = 'AMOUNT',
}

export enum GoalFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum GoalDirection {
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
}

export class CreateHabitTrackerDto {
  @ApiProperty({ example: 'Workout' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Barbell' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'Health', default: 'General' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: HabitType, default: HabitType.BOOLEAN })
  @IsEnum(HabitType)
  @IsOptional()
  type?: HabitType;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  goalValue?: number;

  @ApiPropertyOptional({ example: 'times' })
  @IsString()
  @IsOptional()
  goalUnit?: string;

  @ApiPropertyOptional({ enum: GoalFrequency, default: GoalFrequency.DAILY })
  @IsEnum(GoalFrequency)
  @IsOptional()
  goalFrequency?: GoalFrequency;

  @ApiPropertyOptional({ enum: GoalDirection, default: GoalDirection.INCREASING })
  @IsEnum(GoalDirection)
  @IsOptional()
  goalDirection?: GoalDirection;

  @ApiPropertyOptional({ example: 'emerald', default: 'emerald' })
  @IsString()
  @IsOptional()
  color?: string;
}
