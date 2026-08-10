import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          enableReadyCheck: false,
          retryStrategy: (times: number) => {
            // ponytail: quiet retry interval when local Redis is offline without throwing AggregateError
            return Math.min(times * 5000, 60000);
          },
        },
      }),
      inject: [ConfigService],
    }),
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
