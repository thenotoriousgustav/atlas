import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsISO8601 } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'STNK', description: 'Document type (STNK, Insurance, Warranty, Other)' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: '1234567890', description: 'Document number' })
  @IsString()
  documentNumber: string;

  @ApiPropertyOptional({ example: '2028-05-12T00:00:00.000Z', description: 'Expiration date' })
  @IsISO8601()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'Registration invoice and plates info', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
