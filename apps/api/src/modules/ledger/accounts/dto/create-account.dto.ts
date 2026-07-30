import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'BCA Account', description: 'Account name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CHECKING', description: 'Account type', enum: ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET'] })
  @IsEnum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET'])
  type: string;

  @ApiPropertyOptional({ example: 1000000, description: 'Initial balance' })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: 'IDR', description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: true, description: 'Is on-budget account' })
  @IsBoolean()
  @IsOptional()
  isOnBudget?: boolean;
}
