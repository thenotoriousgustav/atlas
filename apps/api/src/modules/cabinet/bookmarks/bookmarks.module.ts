import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { MetadataService } from '../services/metadata.service';
import { LinkCheckerService } from '../services/link-checker.service';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, MetadataService, LinkCheckerService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
