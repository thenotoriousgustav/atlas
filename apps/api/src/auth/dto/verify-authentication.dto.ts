import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsObject } from 'class-validator';

export class VerifyAuthenticationDto {
  @ApiProperty({ example: 'gustam@example.com', description: 'User email' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The authentication credential payload from browser credential API' })
  @IsObject()
  response: any;
}
