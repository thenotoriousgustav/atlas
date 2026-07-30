import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderBookmarksDto {
  @ApiProperty({ description: 'Array of bookmark IDs in their new order', type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
