import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FetchService } from './fetch.service';
import { ExtractUrlDto } from './dto/extract-url.dto';
import { DownloadMediaDto } from './dto/download-media.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { Response } from 'express';

@ApiTags('fetch')
@ApiBearerAuth()
@Controller('v1/fetch')
@UseGuards(JwtAuthGuard)
export class FetchController {
  constructor(private readonly fetchService: FetchService) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract media information from a social media URL' })
  async extract(@Body() dto: ExtractUrlDto) {
    const data = await this.fetchService.extract(dto.url);
    return data;
  }

  @Post('download')
  @ApiOperation({ summary: 'Stream download the media file directly' })
  async download(
    @CurrentUser() user: any,
    @Body() dto: DownloadMediaDto,
    @Res() res: Response,
  ) {
    return this.fetchService.download(user.id, dto, res);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get personal download history' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'isFavorite', required: false, type: Boolean })
  @ApiQuery({ name: 'collectionId', required: false })
  async getHistory(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    const favBool = isFavorite !== undefined ? isFavorite === 'true' : undefined;
    const data = await this.fetchService.getHistory(user.id, search, platform, favBool, collectionId);
    return data;
  }

  @Patch('history/:id')
  @ApiOperation({ summary: 'Update metadata for a history item (favorite, notes, collection)' })
  async updateHistory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateHistoryDto,
  ) {
    const data = await this.fetchService.updateHistory(user.id, id, dto);
    return data;
  }

  @Delete('history/:id')
  @ApiOperation({ summary: 'Remove a history item' })
  async removeHistory(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.fetchService.removeHistory(user.id, id);
    return data;
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get all download collections' })
  async getCollections(@CurrentUser() user: any) {
    const data = await this.fetchService.getCollections(user.id);
    return data;
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create a new download collection' })
  async createCollection(@CurrentUser() user: any, @Body() dto: CreateCollectionDto) {
    const data = await this.fetchService.createCollection(user.id, dto);
    return data;
  }

  @Delete('collections/:id')
  @ApiOperation({ summary: 'Remove a collection' })
  async removeCollection(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.fetchService.removeCollection(user.id, id);
    return data;
  }
}
