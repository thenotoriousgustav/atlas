import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ example: 'https://nextjs.org', description: 'Bookmark URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Next.js App Router', description: 'Bookmark title (auto-extracted if omitted)' })
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
}
