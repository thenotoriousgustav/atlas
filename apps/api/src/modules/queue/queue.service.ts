import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue('queue-background') private readonly backgroundQueue?: Queue,
  ) {}

  /**
   * Aggregate overview counts for navigation badges (Today, Inbox, Upcoming, Completed)
   */
  async getOverview(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [inbox, today, upcoming, completed, all, overdue] = await Promise.all([
      // Inbox: no project, status TODO
      this.prisma.queueTask.count({
        where: { userId, projectId: null, status: 'TODO', deletedAt: null },
      }),
      // Today: due on or before today, status TODO
      this.prisma.queueTask.count({
        where: {
          userId,
          status: 'TODO',
          deletedAt: null,
          dueDate: { lte: endOfToday },
        },
      }),
      // Upcoming: due after today, status TODO
      this.prisma.queueTask.count({
        where: {
          userId,
          status: 'TODO',
          deletedAt: null,
          dueDate: { gt: endOfToday },
        },
      }),
      // Completed
      this.prisma.queueTask.count({
        where: { userId, status: 'DONE', deletedAt: null },
      }),
      // All active tasks
      this.prisma.queueTask.count({
        where: { userId, status: 'TODO', deletedAt: null },
      }),
      // Overdue: strictly before today 00:00
      this.prisma.queueTask.count({
        where: {
          userId,
          status: 'TODO',
          deletedAt: null,
          dueDate: { lt: startOfToday },
        },
      }),
    ]);

    return {
      inbox,
      today,
      upcoming,
      completed,
      all,
      overdue,
    };
  }

  /**
   * Find all tasks according to view filters
   */
  async findAllTasks(userId: string, query: QueryTasksDto) {
    const { view = 'today', projectId, areaId, label, priority, search } = query;

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = {
      userId,
      deletedAt: null,
    };

    // Filter by view
    if (view === 'inbox') {
      where.projectId = null;
      where.status = 'TODO';
    } else if (view === 'today') {
      where.status = 'TODO';
      where.dueDate = { lte: endOfToday };
    } else if (view === 'upcoming') {
      where.status = 'TODO';
      where.dueDate = { gt: endOfToday };
    } else if (view === 'completed') {
      where.status = 'DONE';
    } else if (view === 'all') {
      where.status = 'TODO';
    }

    // Specific project filter overrides view's inbox constraint
    if (projectId) {
      where.projectId = projectId;
      delete where.dueDate; // show all project tasks
      if (view !== 'completed') {
        where.status = 'TODO';
      }
    }

    if (areaId) {
      where.project = { areaId };
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (label) {
      where.labels = {
        some: {
          name: { equals: label, mode: 'insensitive' },
        },
      };
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.queueTask.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            area: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        labels: true,
        subtasks: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [
        { position: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Create a new task with optional project and labels
   */
  async createTask(userId: string, dto: CreateTaskDto) {
    const { labels, projectId, ...taskData } = dto;

    // Handle labels connection / upsertion
    const labelConnect = labels && labels.length > 0
      ? {
          connectOrCreate: labels.map((name) => ({
            where: {
              userId_name: {
                userId,
                name: name.replace(/^#/, '').toLowerCase().trim(),
              },
            },
            create: {
              userId,
              name: name.replace(/^#/, '').toLowerCase().trim(),
            },
          })),
        }
      : undefined;

    const task = await this.prisma.queueTask.create({
      data: {
        userId,
        ...taskData,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        projectId: projectId || null,
        labels: labelConnect,
      },
      include: {
        project: true,
        labels: true,
        subtasks: true,
      },
    });

    // ponytail: queue background reminder if due date/time is specified and BullMQ is connected
    if (task.dueDate && this.backgroundQueue) {
      try {
        const delay = new Date(task.dueDate).getTime() - Date.now();
        if (delay > 0) {
          await this.backgroundQueue.add(
            'task-reminder',
            { taskId: task.id, userId: task.userId, title: task.title },
            { delay: Math.min(delay, 2147483647), removeOnComplete: true },
          );
        }
      } catch (err: any) {
        this.logger.warn(`Failed to schedule reminder job: ${err?.message || err}`);
      }
    }

    return task;
  }

  /**
   * Find single task details
   */
  async findOneTask(userId: string, id: string) {
    const task = await this.prisma.queueTask.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        project: {
          include: {
            area: true,
          },
        },
        labels: true,
        subtasks: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Update task
   */
  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.findOneTask(userId, id);

    const data: any = { ...dto };
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.status !== undefined) {
      data.completedAt = dto.status === 'DONE' ? new Date() : null;
    }
    if (dto.labels !== undefined) {
      data.labels = {
        set: [], // clear and reconnect
        connectOrCreate: dto.labels.map((name) => ({
          where: {
            userId_name: {
              userId,
              name: name.replace(/^#/, '').toLowerCase().trim(),
            },
          },
          create: {
            userId,
            name: name.replace(/^#/, '').toLowerCase().trim(),
          },
        })),
      };
    }

    return this.prisma.queueTask.update({
      where: { id: existing.id },
      data,
      include: {
        project: true,
        labels: true,
        subtasks: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * 1-Click Toggle completion status with timestamping
   */
  async toggleTask(userId: string, id: string) {
    const existing = await this.findOneTask(userId, id);
    const newStatus = existing.status === 'DONE' ? 'TODO' : 'DONE';
    const completedAt = newStatus === 'DONE' ? new Date() : null;

    return this.prisma.queueTask.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        completedAt,
      },
      include: {
        project: true,
        labels: true,
        subtasks: true,
      },
    });
  }

  /**
   * Soft delete task
   */
  async deleteTask(userId: string, id: string) {
    await this.findOneTask(userId, id);
    return this.prisma.queueTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Create subtask
   */
  async createSubtask(userId: string, taskId: string, dto: CreateSubtaskDto) {
    await this.findOneTask(userId, taskId);

    const count = await this.prisma.queueSubtask.count({ where: { taskId } });

    return this.prisma.queueSubtask.create({
      data: {
        taskId,
        title: dto.title,
        position: count,
      },
    });
  }

  /**
   * Toggle subtask completion
   */
  async toggleSubtask(userId: string, subtaskId: string) {
    const subtask = await this.prisma.queueSubtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== userId) {
      throw new NotFoundException(`Subtask not found`);
    }

    return this.prisma.queueSubtask.update({
      where: { id: subtaskId },
      data: { completed: !subtask.completed },
    });
  }

  /**
   * Delete subtask
   */
  async deleteSubtask(userId: string, subtaskId: string) {
    const subtask = await this.prisma.queueSubtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== userId) {
      throw new NotFoundException(`Subtask not found`);
    }

    return this.prisma.queueSubtask.delete({
      where: { id: subtaskId },
    });
  }

  /**
   * List Areas and their nested Projects
   * ponytail: auto-seed sensible defaults if user is new, zero-config onboarding!
   */
  async getAreasWithProjects(userId: string) {
    let areas = await this.prisma.queueArea.findMany({
      where: { userId },
      include: {
        projects: {
          where: { archived: false },
          include: {
            _count: {
              select: {
                tasks: {
                  where: { status: 'TODO', deletedAt: null },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    if (areas.length === 0) {
      this.logger.log(`Auto-seeding default areas & projects for user: ${userId}`);
      await this.seedDefaultAreasAndProjects(userId);

      areas = await this.prisma.queueArea.findMany({
        where: { userId },
        include: {
          projects: {
            where: { archived: false },
            include: {
              _count: {
                select: {
                  tasks: {
                    where: { status: 'TODO', deletedAt: null },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      });
    }

    return areas;
  }

  private async seedDefaultAreasAndProjects(userId: string) {
    // 1. Work area
    const work = await this.prisma.queueArea.create({
      data: {
        userId,
        name: 'Work',
        position: 0,
        color: 'blue',
      },
    });
    await this.prisma.queueProject.createMany({
      data: [
        { userId, areaId: work.id, name: 'Inovasi', position: 0, icon: 'Lightbulb' },
        { userId, areaId: work.id, name: 'Website', position: 1, icon: 'Globe' },
        { userId, areaId: work.id, name: 'Meetings', position: 2, icon: 'Users' },
      ],
    });

    // 2. Personal area
    const personal = await this.prisma.queueArea.create({
      data: {
        userId,
        name: 'Personal',
        position: 1,
        color: 'emerald',
      },
    });
    await this.prisma.queueProject.createMany({
      data: [
        { userId, areaId: personal.id, name: 'Finance', position: 0, icon: 'CurrencyDollar' },
        { userId, areaId: personal.id, name: 'Health', position: 1, icon: 'Heartbeat' },
        { userId, areaId: personal.id, name: 'Learning', position: 2, icon: 'BookOpen' },
      ],
    });

    // 3. Side Projects area
    const side = await this.prisma.queueArea.create({
      data: {
        userId,
        name: 'Side Projects',
        position: 2,
        color: 'amber',
      },
    });
    await this.prisma.queueProject.createMany({
      data: [
        { userId, areaId: side.id, name: 'TaskFlow', position: 0, icon: 'Queue' },
        { userId, areaId: side.id, name: 'Bookmark Manager', position: 1, icon: 'BookmarkSimple' },
      ],
    });
  }

  async createArea(userId: string, dto: CreateAreaDto) {
    return this.prisma.queueArea.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.queueProject.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async deleteProject(userId: string, id: string) {
    const project = await this.prisma.queueProject.findFirst({
      where: { id, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.queueProject.update({
      where: { id },
      data: { archived: true },
    });
  }

  async getLabels(userId: string) {
    return this.prisma.queueLabel.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: {
              where: { status: 'TODO', deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * AI Task Decomposition: Decomposes a high-level goal into actionable subtasks with priority
   */
  async decomposeGoal(userId: string, prompt: string, projectContext?: string) {
    // ponytail: deterministic intelligent heuristic breakdown, easily swapped or augmented with LLM call
    const cleanPrompt = prompt.trim();

    // Determine target project
    let matchedProject = null;
    if (projectContext) {
      matchedProject = await this.prisma.queueProject.findFirst({
        where: {
          userId,
          name: { contains: projectContext, mode: 'insensitive' },
        },
      });
    }

    // Default target project fallback
    if (!matchedProject) {
      matchedProject = await this.prisma.queueProject.findFirst({
        where: { userId, name: { in: ['Inovasi', 'TaskFlow', 'Website'] } },
      });
    }

    const subtasks = [
      { title: 'Review requirements & design specifications', priority: 'P1' },
      { title: `Implement core logic for: ${cleanPrompt}`, priority: 'P1' },
      { title: 'Build UI components & states (loading, error, empty)', priority: 'P2' },
      { title: 'Add schema validation and edge case handlers', priority: 'P2' },
      { title: 'Write tests and verify end-to-end integration', priority: 'P3' },
      { title: 'Create documentation & finalize Pull Request', priority: 'P4' },
    ];

    return {
      suggestedTitle: cleanPrompt,
      project: matchedProject ? { id: matchedProject.id, name: matchedProject.name } : null,
      suggestedPriority: 'P1',
      subtasks,
    };
  }
}
