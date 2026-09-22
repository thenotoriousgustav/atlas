import { ApiPropertyOptional } from "@nestjs/swagger"
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator"
import { BookmarkType } from "@prisma/client"

export class UpdateBookmarkDto {
  @ApiPropertyOptional({
    example: "https://nextjs.org",
    description: "Bookmark URL",
  })
  @IsString()
  @IsOptional()
  url?: string

  @ApiPropertyOptional({
    enum: BookmarkType,
    description: "Item type: BOOKMARK or NOTE",
  })
  @IsEnum(BookmarkType)
  @IsOptional()
  type?: BookmarkType

  @ApiPropertyOptional({
    example: "Next.js App Router",
    description: "Bookmark title",
  })
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional({
    example: "Next.js developer reference manual",
    description: "Bookmark description",
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
    example: ["Next.js", "React"],
    description: "List of tags",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @ApiPropertyOptional({
    example: true,
    description: "Is bookmarked as favorite",
  })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean

  @ApiPropertyOptional({
    example: false,
    description: "Is bookmarked archived",
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean
}
