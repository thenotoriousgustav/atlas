import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class UpdateBudgetEntryDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Category UUID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 7, description: 'Month (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 500000, description: 'Assigned amount' })
  @IsNumber()
  assigned: number;
}
