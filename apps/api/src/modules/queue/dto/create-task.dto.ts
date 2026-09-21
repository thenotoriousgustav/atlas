import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Fix login bug' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Task detailed description or markdown notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Target Project UUID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['P1', 'P2', 'P3', 'P4', 'NONE'], default: 'NONE' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Due date in ISO format (YYYY-MM-DD or full timestamp)' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Due time in HH:mm format', example: '10:00' })
  @IsString()
  @IsOptional()
  dueTime?: string;

  @ApiPropertyOptional({ description: 'Recurrence rule', enum: ['DAILY', 'WEEKLY', 'MONTHLY'] })
  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional({ description: 'Array of label names or IDs', example: ['urgent', 'coding'] })
  @IsArray()
  @IsOptional()
  labels?: string[];
}
