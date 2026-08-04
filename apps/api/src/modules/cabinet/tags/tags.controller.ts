import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('v1/tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  async create(@Body() dto: { name: string }) {
    return this.tagsService.create(dto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active tags with bookmarks count' })
  async findAll(@CurrentUser() user: any) {
    return this.tagsService.findAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag by id' })
  async remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
