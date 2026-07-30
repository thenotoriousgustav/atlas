import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImportBookmarksDto {
  @ApiProperty({ description: 'Netscape HTML bookmark file content as raw string' })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;
}
