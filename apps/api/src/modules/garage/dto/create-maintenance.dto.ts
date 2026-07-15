import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, IsISO8601, ValidateNested } from 'class-validator';

export class MaintenanceItemDto {
  @ApiProperty({ example: 'Engine Oil', description: 'Type of maintenance service/item' })
  @IsString()
  type: string;

  @ApiProperty({ example: 45000, description: 'Cost of this item' })
  @IsNumber()
  cost: number;
}

export class MaintenancePartDto {
  @ApiProperty({ example: 'Federal Oil 10W-30', description: 'Name of the part installed' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Federal', description: 'Brand of the part' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 3000, description: 'Expected mileage lifetime (km)' })
  @IsNumber()
  @IsOptional()
  expectedLife?: number;
}

export class CreateMaintenanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Date of service' })
  @IsISO8601()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 13000, description: 'Odometer mileage at service' })
  @IsNumber()
  odometer: number;

  @ApiPropertyOptional({ example: 'AHASS Kebon Jeruk', description: 'Workshop name' })
  @IsString()
  @IsOptional()
  workshop?: string;

  @ApiPropertyOptional({ example: 'Regular oil change and CVT cleaning', description: 'Service notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 120000, description: 'Total service cost (parts + labor)' })
  @IsNumber()
  totalCost: number;

  @ApiPropertyOptional({ type: [MaintenanceItemDto], description: 'Detailed items/jobs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceItemDto)
  @IsOptional()
  items?: MaintenanceItemDto[];

  @ApiPropertyOptional({ type: [MaintenancePartDto], description: 'Parts replaced during this service' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenancePartDto)
  @IsOptional()
  parts?: MaintenancePartDto[];
}
