import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, IsISO8601 } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Source Account UUID' })
  @IsUUID()
  sourceAccountId: string;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', description: 'Destination Account UUID' })
  @IsUUID()
  destinationAccountId: string;

  @ApiProperty({ example: 150000, description: 'Transfer amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'Transfer to GoPay', description: 'Transaction title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Top-up monthly pocket money', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date of transfer' })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
