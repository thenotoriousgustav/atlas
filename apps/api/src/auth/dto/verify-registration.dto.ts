import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class VerifyRegistrationDto {
  @ApiProperty({ description: 'The registration credential payload from browser credential API' })
  @IsObject()
  response: any;
}
