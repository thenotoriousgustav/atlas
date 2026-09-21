import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'queue-background',
    }),
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueProcessor],
  exports: [QueueService],
})
export class QueueModule {}
