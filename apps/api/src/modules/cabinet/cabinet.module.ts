import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    PrismaModule,
    BookmarksModule,
    FoldersModule,
    TagsModule,
  ],
  exports: [
    BookmarksModule,
    FoldersModule,
    TagsModule,
  ],
})
export class CabinetModule {}
