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
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { ImportBookmarksDto } from './dto/import-bookmarks.dto';

import { ReorderBookmarksDto } from './dto/reorder-bookmarks.dto';

@ApiTags('bookmarks')
@ApiBearerAuth()
@Controller('v1/bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Public()
  @Get('proxy-image')
  @ApiOperation({ summary: 'Proxy external image to bypass CORS and hotlink protection' })
  @ApiQuery({ name: 'url', required: true })
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    return this.bookmarksService.proxyImage(url, res);
  }

  @Get('scrape')
  @ApiOperation({ summary: 'Scrape metadata and generate tags for a URL' })
  @ApiQuery({ name: 'url', required: true })
  async scrape(@Query('url') url: string) {
    return this.bookmarksService.scrapeUrl(url);
  }

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
  @ApiQuery({ name: 'isTrash', required: false, type: Boolean })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('folderId') folderId?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('isArchived') isArchived?: string,
    @Query('isTrash') isTrash?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
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
      isTrash: parseBool(isTrash),
      tag,
      search,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
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

  @Get('health')
  @ApiOperation({ summary: 'Get bookmark health status count summary' })
  async getHealthSummary(@CurrentUser() user: any) {
    return this.bookmarksService.getHealthSummary(user.id);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Get groups of duplicate bookmarks' })
  async getDuplicates(@CurrentUser() user: any) {
    return this.bookmarksService.getDuplicates(user.id);
  }

  @Delete('duplicates/clean')
  @ApiOperation({ summary: 'Auto-clean duplicate bookmarks' })
  async cleanDuplicates(@CurrentUser() user: any) {
    return this.bookmarksService.cleanDuplicates(user.id);
  }

  @Post('health/check')
  @ApiOperation({ summary: 'Trigger manual scan of bookmark links status' })
  async triggerHealthCheck(@CurrentUser() user: any) {
    return this.bookmarksService.triggerHealthCheck(user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder bookmarks position' })
  async reorder(
    @CurrentUser() user: any,
    @Body() reorderDto: ReorderBookmarksDto,
  ) {
    return this.bookmarksService.reorder(user.id, reorderDto.ids);
  }

  @Post('bulk/restore')
  @ApiOperation({ summary: 'Restore multiple soft-deleted bookmarks' })
  async bulkRestore(
    @CurrentUser() user: any,
    @Body() body: { ids: string[] },
  ) {
    return this.bookmarksService.bulkRestore(user.id, body.ids || []);
  }

  @Post('bulk/permanent-delete')
  @ApiOperation({ summary: 'Permanently delete multiple bookmarks' })
  async bulkPermanentDelete(
    @CurrentUser() user: any,
    @Body() body: { ids: string[] },
  ) {
    return this.bookmarksService.bulkPermanentDelete(user.id, body.ids || []);
  }

  @Delete('trash/empty')
  @ApiOperation({ summary: 'Permanently delete all bookmarks in trash' })
  async emptyTrash(@CurrentUser() user: any) {
    return this.bookmarksService.emptyTrash(user.id);
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

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted bookmark' })
  async restore(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.restore(user.id, id);
  }

  @Post(':id/enrichment/refresh')
  @ApiOperation({ summary: 'Refresh enrichment metadata for a bookmark' })
  async refreshEnrichment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.refreshEnrichment(user.id, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a bookmark by ID' })
  async permanentDelete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.permanentDelete(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a bookmark by ID' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookmarksService.remove(user.id, id);
  }
}
