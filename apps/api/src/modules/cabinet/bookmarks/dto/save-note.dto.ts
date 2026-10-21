import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator"

export class SaveNoteDto {
  @ApiPropertyOptional({ description: "Destination folder for a new note" })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  folderId?: string | null

  @ApiPropertyOptional({ description: "Note title" })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ description: "Plain-text preview of the note" })
  @IsString()
  @IsOptional()
  notes?: string

  @ApiPropertyOptional({ description: "Replaces the note tags when provided", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  tags?: string[]

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Tiptap document JSON",
  })
  @IsObject()
  noteDocument!: Record<string, any>
}
