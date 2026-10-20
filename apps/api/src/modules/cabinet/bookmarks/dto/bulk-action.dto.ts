import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator"

export class BulkActionDto {
  @ApiProperty({ description: "Array of bookmark IDs", type: [String] })
  @IsArray()
  @IsUUID("4", { each: true })
  ids: string[]
}

export class BulkArchiveDto extends BulkActionDto {
  @ApiPropertyOptional({ description: "Archive status", default: true })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean
}

export class BulkMoveDto extends BulkActionDto {
  @ApiPropertyOptional({
    description: "Target folder ID (null for root)",
    nullable: true,
  })
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsUUID("4")
  @IsOptional()
  folderId?: string | null
}

export class BulkTagsDto extends BulkActionDto {
  @ApiProperty({
    description: "Tags to add to the selected bookmarks",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[]
}
