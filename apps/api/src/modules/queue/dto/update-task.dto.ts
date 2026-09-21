import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsArray } from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Task detailed description or markdown notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Status of task', enum: ['TODO', 'DONE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Target Project UUID or null' })
  @IsString()
  @IsOptional()
  projectId?: string | null;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['P1', 'P2', 'P3', 'P4', 'NONE'] })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Due date in ISO format or null' })
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ description: 'Due time in HH:mm format or null' })
  @IsString()
  @IsOptional()
  dueTime?: string | null;

  @ApiPropertyOptional({ description: 'Recurrence rule' })
  @IsString()
  @IsOptional()
  recurrenceRule?: string | null;

  @ApiPropertyOptional({ description: 'Ordering position' })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ description: 'Array of label names or IDs' })
  @IsArray()
  @IsOptional()
  labels?: string[];
}
