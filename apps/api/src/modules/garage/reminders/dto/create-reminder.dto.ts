import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, IsISO8601, IsIn } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'Oil Change', description: 'Type/title of reminder' })
  @IsString()
  type: string;

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
