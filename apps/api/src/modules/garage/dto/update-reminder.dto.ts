import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsISO8601, IsIn } from 'class-validator';

export class UpdateReminderDto {
  @ApiPropertyOptional({ example: 'Oil Change', description: 'Type/title of reminder' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z', description: 'Due date' })
  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Due odometer mileage' })
  @IsNumber()
  @IsOptional()
  dueMileage?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Reminder status', enum: ['ACTIVE', 'COMPLETED', 'OVERDUE'] })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'COMPLETED', 'OVERDUE'])
  status?: string;
}
