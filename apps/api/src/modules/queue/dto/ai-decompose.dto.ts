import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiDecomposeDto {
  @ApiProperty({
    description: 'High level goal or prompt to decompose',
    example: 'Buatkan task untuk menyelesaikan fitur login minggu ini',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Optional project name or UUID context' })
  @IsString()
  @IsOptional()
  projectContext?: string;
}
