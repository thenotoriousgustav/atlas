import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: PrismaService;

  const mockPrisma = {
    queueTask: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    queueArea: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    queueProject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    queueSubtask: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    queueLabel: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should aggregate task counts correctly', async () => {
      mockPrisma.queueTask.count
        .mockResolvedValueOnce(5) // inbox
        .mockResolvedValueOnce(3) // today
        .mockResolvedValueOnce(8) // upcoming
        .mockResolvedValueOnce(12) // completed
        .mockResolvedValueOnce(16) // all
        .mockResolvedValueOnce(1); // overdue

      const result = await service.getOverview('user-123');

      expect(result).toEqual({
        inbox: 5,
        today: 3,
        upcoming: 8,
        completed: 12,
        all: 16,
        overdue: 1,
      });
    });
  });

  describe('toggleTask', () => {
    it('should flip task status from TODO to DONE with timestamp', async () => {
      mockPrisma.queueTask.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'TODO',
        userId: 'user-123',
      });
      mockPrisma.queueTask.update.mockResolvedValueOnce({
        id: 'task-1',
        status: 'DONE',
        completedAt: new Date(),
      });

      const result = await service.toggleTask('user-123', 'task-1');

      expect(result.status).toBe('DONE');
      expect(mockPrisma.queueTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({ status: 'DONE' }),
        })
      );
    });
  });

  describe('decomposeGoal', () => {
    it('should generate structured actionable subtasks with priorities', async () => {
      mockPrisma.queueProject.findFirst.mockResolvedValueOnce({
        id: 'proj-1',
        name: 'Inovasi',
      });

      const result = await service.decomposeGoal(
        'user-123',
        'Selesaikan fitur login minggu ini',
        'Inovasi'
      );

      expect(result.suggestedTitle).toBe('Selesaikan fitur login minggu ini');
      expect(result.project?.name).toBe('Inovasi');
      expect(result.subtasks.length).toBeGreaterThan(0);
      expect(result.subtasks[0].priority).toBe('P1');
    });
  });
});
