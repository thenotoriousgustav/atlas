import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator"

export class SaveNoteDto {
  @ApiPropertyOptional({ description: "Destination folder for a new note" })
  @IsUUID()
  @IsOptional()
  folderId?: string

  @ApiPropertyOptional({ description: "Note title" })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ description: "Plain-text preview of the note" })
  @IsString()
  @IsOptional()
  notes?: string

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Tiptap document JSON",
  })
  @IsObject()
  noteDocument!: Record<string, any>
}
