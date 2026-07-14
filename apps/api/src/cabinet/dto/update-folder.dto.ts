import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFolderDto {
  @ApiPropertyOptional({ example: 'Resources', description: 'Folder name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Design and dev bookmarks', description: 'Folder description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Parent folder ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
