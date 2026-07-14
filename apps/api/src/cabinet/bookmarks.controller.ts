import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { ImportBookmarksDto } from './dto/import-bookmarks.dto';

@ApiTags('bookmarks')
@ApiBearerAuth()
@Controller('v1/bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bookmark (extracts title/metadata if omitted)' })
  async create(
    @CurrentUser() user: any,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ) {
    return this.bookmarksService.create(user.id, createBookmarkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookmarks with optional filtering' })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiQuery({ name: 'isFavorite', required: false, type: Boolean })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('folderId') folderId?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('isArchived') isArchived?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
  ) {
    const parseBool = (val?: string) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    };
    return this.bookmarksService.findAll(user.id, {
      folderId,
      isFavorite: parseBool(isFavorite),
      isArchived: parseBool(isArchived),
      tag,
      search,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export bookmarks as HTML file' })
  async export(
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const html = await this.bookmarksService.exportBookmarks(user.id);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=cabinet_bookmarks.html');
    res.send(html);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import bookmarks from HTML file' })
  async import(
    @CurrentUser() user: any,
    @Body() importBookmarksDto: ImportBookmarksDto,
  ) {
    return this.bookmarksService.importBookmarks(user.id, importBookmarksDto.htmlContent);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bookmark details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bookmark by ID' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
  ) {
    return this.bookmarksService.update(user.id, id, updateBookmarkDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a bookmark by ID' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.remove(user.id, id);
  }
}
