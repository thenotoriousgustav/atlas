import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'BCA Account', description: 'Account name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'CHECKING', description: 'Account type', enum: ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET'] })
  @IsEnum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 1200000, description: 'Balance of account' })
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
