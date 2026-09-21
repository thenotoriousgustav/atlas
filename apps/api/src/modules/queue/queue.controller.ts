import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueueService } from './queue.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { AiDecomposeDto } from './dto/ai-decompose.dto';

@ApiTags('queue')
@ApiBearerAuth()
@Controller('v1/queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get queue badge counts for Inbox, Today, Upcoming, and Overdue' })
  async getOverview(@CurrentUser() user: any) {
    return this.queueService.getOverview(user.id);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks filtered by view, project, area, label, or search' })
  async findAllTasks(
    @CurrentUser() user: any,
    @Query() query: QueryTasksDto,
  ) {
    return this.queueService.findAllTasks(user.id, query);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @CurrentUser() user: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.queueService.createTask(user.id, dto);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task detail by ID' })
  async findOneTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.queueService.findOneTask(user.id, id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task properties' })
  async updateTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.queueService.updateTask(user.id, id, dto);
  }

  @Post('tasks/:id/toggle')
  @ApiOperation({ summary: '1-click toggle task completion status' })
  async toggleTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.queueService.toggleTask(user.id, id);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.queueService.deleteTask(user.id, id);
  }

  @Post('tasks/:id/subtasks')
  @ApiOperation({ summary: 'Add a subtask to a task' })
  async createSubtask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.queueService.createSubtask(user.id, id, dto);
  }

  @Patch('subtasks/:subtaskId/toggle')
  @ApiOperation({ summary: 'Toggle subtask completion' })
  async toggleSubtask(
    @CurrentUser() user: any,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.queueService.toggleSubtask(user.id, subtaskId);
  }

  @Delete('subtasks/:subtaskId')
  @ApiOperation({ summary: 'Delete a subtask' })
  async deleteSubtask(
    @CurrentUser() user: any,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.queueService.deleteSubtask(user.id, subtaskId);
  }

  @Get('areas')
  @ApiOperation({ summary: 'List areas with nested projects and task counts' })
  async getAreasWithProjects(@CurrentUser() user: any) {
    return this.queueService.getAreasWithProjects(user.id);
  }

  @Post('areas')
  @ApiOperation({ summary: 'Create a new area' })
  async createArea(
    @CurrentUser() user: any,
    @Body() dto: CreateAreaDto,
  ) {
    return this.queueService.createArea(user.id, dto);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a new project' })
  async createProject(
    @CurrentUser() user: any,
    @Body() dto: CreateProjectDto,
  ) {
    return this.queueService.createProject(user.id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Archive a project' })
  async deleteProject(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.queueService.deleteProject(user.id, id);
  }

  @Get('labels')
  @ApiOperation({ summary: 'List all user labels' })
  async getLabels(@CurrentUser() user: any) {
    return this.queueService.getLabels(user.id);
  }

  @Post('ai/decompose')
  @ApiOperation({ summary: 'AI Task Decomposition from natural language goal' })
  async decomposeGoal(
    @CurrentUser() user: any,
    @Body() dto: AiDecomposeDto,
  ) {
    return this.queueService.decomposeGoal(user.id, dto.prompt, dto.projectContext);
  }
}
