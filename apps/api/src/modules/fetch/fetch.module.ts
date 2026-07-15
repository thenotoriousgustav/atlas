import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FetchController } from './fetch.controller';
import { FetchService } from './fetch.service';

@Module({
  imports: [PrismaModule],
  controllers: [FetchController],
  providers: [FetchService],
  exports: [FetchService],
})
export class FetchModule {}
