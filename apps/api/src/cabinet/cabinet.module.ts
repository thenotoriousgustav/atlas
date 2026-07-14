import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FoldersService } from './folders.service';
import { BookmarksService } from './bookmarks.service';
import { TagsService } from './tags.service';
import { MetadataService } from './metadata.service';
import { FoldersController } from './folders.controller';
import { BookmarksController } from './bookmarks.controller';
import { TagsController } from './tags.controller';

@Module({
  imports: [PrismaModule],
  providers: [
    FoldersService,
    BookmarksService,
    TagsService,
    MetadataService,
  ],
  controllers: [
    FoldersController,
    BookmarksController,
    TagsController,
  ],
  exports: [
    FoldersService,
    BookmarksService,
    TagsService,
  ],
})
export class CabinetModule {}
