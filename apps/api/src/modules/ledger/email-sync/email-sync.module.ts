import { Module } from '@nestjs/common';
import { EmailSyncController } from './email-sync.controller';
import { EmailSyncService } from './email-sync.service';

@Module({
  controllers: [EmailSyncController],
  providers: [EmailSyncService],
  exports: [EmailSyncService],
})
export class EmailSyncModule {}
