import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from "class-validator"
import { BookmarkType } from "@prisma/client"

export class CreateBookmarkDto {
  @ApiPropertyOptional({
    example: "https://nextjs.org",
    description: "URL (optional for standalone notes)",
  })
  @IsString()
  @IsOptional()
  url?: string

  @ApiPropertyOptional({
    enum: BookmarkType,
    default: BookmarkType.BOOKMARK,
    description: "Item type: BOOKMARK or NOTE",
  })
  @IsEnum(BookmarkType)
  @IsOptional()
  type?: BookmarkType

  @ApiPropertyOptional({
    example: "My Note / Bookmark Title",
    description: "Title (auto-extracted if omitted for URLs)",
  })
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional({
    example: "Quick summary or excerpt",
    description: "Short description",
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({
    example: "Personal markdown notes and thoughts",
    description: "Markdown notes and annotations",
  })
  @IsString()
  @IsOptional()
  notes?: string

  @ApiPropertyOptional({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Folder ID",
  })
  @IsUUID()
  @IsOptional()
  folderId?: string

  @ApiPropertyOptional({
    example: ["React", "Architecture"],
    description: "List of tags",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]
}
