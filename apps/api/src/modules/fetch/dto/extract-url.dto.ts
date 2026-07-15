import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class ExtractUrlDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Social media URL to extract metadata from' })
  @IsString()
  @IsUrl()
  url: string;
}
