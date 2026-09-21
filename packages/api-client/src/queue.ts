import { customInstance } from './custom-instance';

export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'NONE';
export type TaskStatus = 'TODO' | 'DONE';

export interface QueueSubtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueLabel {
  id: string;
  name: string;
  color: string;
  _count?: {
    tasks: number;
  };
}

export interface QueueProject {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position: number;
  areaId?: string | null;
  area?: { id: string; name: string } | null;
  _count?: {
    tasks: number;
  };
}

export interface QueueArea {
  id: string;
  name: string;
  color?: string | null;
  position: number;
  projects: QueueProject[];
}

export interface QueueTask {
  id: string;
  userId: string;
  projectId?: string | null;
  project?: QueueProject | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
  completedAt?: string | null;
  recurrenceRule?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  subtasks: QueueSubtask[];
  labels: QueueLabel[];
}

export interface QueueOverview {
  inbox: number;
  today: number;
  upcoming: number;
  completed: number;
  all: number;
  overdue: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId?: string;
  priority?: TaskPriority | string;
  dueDate?: string;
  dueTime?: string;
  recurrenceRule?: string;
  labels?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus | string;
  projectId?: string | null;
  priority?: TaskPriority | string;
  dueDate?: string | null;
  dueTime?: string | null;
  recurrenceRule?: string | null;
  position?: number;
  labels?: string[];
}

export interface QueryTasksParams {
  view?: 'inbox' | 'today' | 'upcoming' | 'completed' | 'all';
  projectId?: string;
  areaId?: string;
  label?: string;
  priority?: string;
  search?: string;
}

export interface DecomposeGoalResponse {
  suggestedTitle: string;
  project?: { id: string; name: string } | null;
  suggestedPriority: string;
  subtasks: { title: string; priority: string }[];
}

export const queueApi = {
  // Overview stats
  getOverview: async (): Promise<{ success: boolean; data: QueueOverview }> => {
    return customInstance({
      url: '/v1/queue/overview',
      method: 'GET',
    });
  },

  // Tasks list
  getTasks: async (
    params?: QueryTasksParams
  ): Promise<{ success: boolean; data: QueueTask[] }> => {
    return customInstance({
      url: '/v1/queue/tasks',
      method: 'GET',
      params,
    });
  },

  // Single task
  getTask: async (id: string): Promise<{ success: boolean; data: QueueTask }> => {
    return customInstance({
      url: `/v1/queue/tasks/${id}`,
      method: 'GET',
    });
  },

  // Create task
  createTask: async (
    data: CreateTaskPayload
  ): Promise<{ success: boolean; data: QueueTask }> => {
    return customInstance({
      url: '/v1/queue/tasks',
      method: 'POST',
      data,
    });
  },

  // Update task
  updateTask: async (
    id: string,
    data: UpdateTaskPayload
  ): Promise<{ success: boolean; data: QueueTask }> => {
    return customInstance({
      url: `/v1/queue/tasks/${id}`,
      method: 'PATCH',
      data,
    });
  },

  // 1-Click Toggle completion
  toggleTask: async (
    id: string
  ): Promise<{ success: boolean; data: QueueTask }> => {
    return customInstance({
      url: `/v1/queue/tasks/${id}/toggle`,
      method: 'POST',
    });
  },

  // Delete task
  deleteTask: async (id: string): Promise<{ success: boolean }> => {
    return customInstance({
      url: `/v1/queue/tasks/${id}`,
      method: 'DELETE',
    });
  },

  // Subtasks
  createSubtask: async (
    taskId: string,
    title: string
  ): Promise<{ success: boolean; data: QueueSubtask }> => {
    return customInstance({
      url: `/v1/queue/tasks/${taskId}/subtasks`,
      method: 'POST',
      data: { title },
    });
  },

  toggleSubtask: async (
    subtaskId: string
  ): Promise<{ success: boolean; data: QueueSubtask }> => {
    return customInstance({
      url: `/v1/queue/subtasks/${subtaskId}/toggle`,
      method: 'PATCH',
    });
  },

  deleteSubtask: async (subtaskId: string): Promise<{ success: boolean }> => {
    return customInstance({
      url: `/v1/queue/subtasks/${subtaskId}`,
      method: 'DELETE',
    });
  },

  // Areas & Projects
  getAreas: async (): Promise<{ success: boolean; data: QueueArea[] }> => {
    return customInstance({
      url: '/v1/queue/areas',
      method: 'GET',
    });
  },

  createArea: async (data: {
    name: string;
    color?: string;
  }): Promise<{ success: boolean; data: QueueArea }> => {
    return customInstance({
      url: '/v1/queue/areas',
      method: 'POST',
      data,
    });
  },

  createProject: async (data: {
    name: string;
    areaId?: string;
    color?: string;
    icon?: string;
  }): Promise<{ success: boolean; data: QueueProject }> => {
    return customInstance({
      url: '/v1/queue/projects',
      method: 'POST',
      data,
    });
  },

  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    return customInstance({
      url: `/v1/queue/projects/${id}`,
      method: 'DELETE',
    });
  },

  // Labels
  getLabels: async (): Promise<{ success: boolean; data: QueueLabel[] }> => {
    return customInstance({
      url: '/v1/queue/labels',
      method: 'GET',
    });
  },

  // AI goal decomposition
  decomposeGoal: async (
    prompt: string,
    projectContext?: string
  ): Promise<{ success: boolean; data: DecomposeGoalResponse }> => {
    return customInstance({
      url: '/v1/queue/ai/decompose',
      method: 'POST',
      data: { prompt, projectContext },
    });
  },
};
