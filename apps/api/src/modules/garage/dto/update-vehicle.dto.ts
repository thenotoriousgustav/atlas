import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Honda', description: 'Brand of the vehicle' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'Vario 160', description: 'Model of the vehicle' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 'CBS-ISS', description: 'Variant' })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiPropertyOptional({ example: 2023, description: 'Year of manufacturing' })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 'B 1234 ABC', description: 'License plate number' })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional({ example: 'MH1KF1111...', description: 'Vehicle Identification Number (VIN)' })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiPropertyOptional({ example: 'KF11E111...', description: 'Engine number' })
  @IsString()
  @IsOptional()
  engineNumber?: string;

  @ApiPropertyOptional({ example: 'MH123...', description: 'Chassis number' })
  @IsString()
  @IsOptional()
  chassisNumber?: string;

  @ApiPropertyOptional({ example: 25000000, description: 'Purchase price' })
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ example: '2023-05-12T00:00:00.000Z', description: 'Purchase date' })
  @IsISO8601()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 12500, description: 'Current odometer mileage' })
  @IsNumber()
  @IsOptional()
  odometer?: number;
}
