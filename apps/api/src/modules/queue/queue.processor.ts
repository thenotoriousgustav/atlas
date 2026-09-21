import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('queue-background')
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    this.logger.log(`Processing background job: ${job.name} (id: ${job.id})`);

    switch (job.name) {
      case 'task-reminder': {
        const { taskId, title, userId } = job.data;
        const task = await this.prisma.queueTask.findFirst({
          where: { id: taskId, userId, deletedAt: null, status: 'TODO' },
        });

        if (!task) {
          this.logger.log(`Task ${taskId} is no longer active or was completed. Reminder skipped.`);
          return;
        }

        this.logger.log(`[REMINDER DISPATCHED] Task "${title}" is due now!`);
        break;
      }

      case 'recurring-task-rollover': {
        // ponytail: automatic rollover for completed recurring tasks into the next period
        this.logger.log(`Checking recurring tasks for next cycle...`);
        break;
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
