import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class CreateFuelDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 4.2, description: 'Liters of fuel filled' })
  @IsNumber()
  liters: number;

  @ApiProperty({ example: 13500, description: 'Price per liter (IDR)' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 12650, description: 'Odometer mileage at refueling' })
  @IsNumber()
  odometer: number;
}
