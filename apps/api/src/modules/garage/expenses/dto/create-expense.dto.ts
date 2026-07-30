import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, IsISO8601 } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'Toll', description: 'Expense category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 20000, description: 'Amount spent' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date of expense' })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
