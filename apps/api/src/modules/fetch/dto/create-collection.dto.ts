import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'My Favorites', description: 'Name of the collection' })
  @IsString()
  @MinLength(1)
  name: string;
}
