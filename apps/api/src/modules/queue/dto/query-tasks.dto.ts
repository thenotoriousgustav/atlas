import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTasksDto {
  @ApiPropertyOptional({
    description: 'Filter view mode',
    enum: ['inbox', 'today', 'upcoming', 'completed', 'all'],
    default: 'today',
  })
  @IsString()
  @IsOptional()
  view?: 'inbox' | 'today' | 'upcoming' | 'completed' | 'all';

  @ApiPropertyOptional({ description: 'Filter by Project UUID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by Area UUID' })
  @IsString()
  @IsOptional()
  areaId?: string;

  @ApiPropertyOptional({ description: 'Filter by Label name or ID' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Filter by Priority level', enum: ['P1', 'P2', 'P3', 'P4'] })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Search term across title and description' })
  @IsString()
  @IsOptional()
  search?: string;
}
