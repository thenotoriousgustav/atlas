import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiCookieAuth()
@Controller('v1/tags')
@UseGuards(AuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  async create(@CurrentUser() user: any, @Body() dto: { name: string }) {
    return this.tagsService.create(user.id, dto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active tags with bookmarks count' })
  async findAll(@CurrentUser() user: any) {
    return this.tagsService.findAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag by id' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tagsService.remove(user.id, id);
  }
}
