import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator"

export class SaveDrawingDto {
  @ApiPropertyOptional({ description: "Destination folder; null moves the drawing to Unfiled" })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  folderId?: string | null

  @ApiPropertyOptional({ description: "Drawing title" })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ description: "Replaces the drawing tags when provided", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  tags?: string[]

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Excalidraw scene: { elements, appState, files }",
  })
  @IsObject()
  scene!: Record<string, any>

  @ApiPropertyOptional({ description: "Small image of the drawing for cards, as a data URL; an empty string clears it" })
  @IsString()
  @MaxLength(600_000)
  @Matches(/^(data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+)?$/, { message: "preview must be a PNG, WebP or JPEG data URL" })
  @IsOptional()
  preview?: string
}
