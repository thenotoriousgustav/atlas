import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class UpdateBookmarkDto {
  @ApiPropertyOptional({ example: 'https://nextjs.org', description: 'Bookmark URL' })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ example: 'Next.js App Router', description: 'Bookmark title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Next.js developer reference manual', description: 'Bookmark description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Folder ID' })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ example: ['Next.js', 'React'], description: 'List of tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: true, description: 'Is bookmarked as favorite' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is bookmarked archived' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
