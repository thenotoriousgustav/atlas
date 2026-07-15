import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateHistoryDto {
  @ApiPropertyOptional({ example: 'Funny meme video', description: 'Personal notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Favorite flag status' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Collection ID or null to remove' })
  @IsUUID()
  @IsOptional()
  collectionId?: string | null;
}
