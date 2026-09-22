import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsString, IsUrl, IsOptional, IsIn } from "class-validator"

export class DownloadMediaDto {
  @ApiProperty({
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "URL of the video or media",
  })
  @IsString()
  @IsUrl()
  url: string

  @ApiPropertyOptional({
    example: "137+140",
    description: "yt-dlp format ID to download",
  })
  @IsString()
  @IsOptional()
  formatId?: string

  @ApiProperty({
    example: "VIDEO",
    description: "Type of media to download (VIDEO, AUDIO)",
  })
  @IsString()
  @IsIn(["VIDEO", "AUDIO"])
  mediaType: string

  @ApiProperty({
    example: "Video Title",
    description: "Title of the video media",
  })
  @IsString()
  title: string
}
