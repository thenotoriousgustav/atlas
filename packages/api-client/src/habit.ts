import { customInstance } from './custom-instance';

export type HabitType = 'BOOLEAN' | 'COUNT' | 'DURATION' | 'NUMERIC' | 'AMOUNT';
export type GoalFrequency = 'DAILY' | 'WEEKLY';
export type GoalDirection = 'INCREASING' | 'DECREASING';

export interface HabitTracker {
  id: string;
  userId: string;
  name: string;
  icon?: string | null;
  category: string;
  type: HabitType;
  goalValue: number;
  goalUnit?: string | null;
  goalFrequency: GoalFrequency;
  goalDirection: GoalDirection;
  color: string;
  reminderTime?: string | null;
  quickSteppers?: number[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  todayEntry?: HabitEntry | null;
  isCompletedToday?: boolean;
}

export interface HabitEntry {
  id: string;
  trackerId: string;
  date: string;
  value: number;
  durationSeconds?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  completionRate: number;
  heatmapData: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

export interface HabitDetail extends HabitTracker {
  entries: HabitEntry[];
  stats: HabitStats;
}

export interface HabitDashboardSummary {
  totalTrackers: number;
  completedTodayCount: number;
  todayProgressRate: number;
  trackers: HabitTracker[];
  aggregatedHeatmap: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

export interface CreateHabitTrackerDto {
  name: string;
  icon?: string;
  category?: string;
  type?: HabitType;
  goalValue?: number;
  goalUnit?: string;
  goalFrequency?: GoalFrequency;
  goalDirection?: GoalDirection;
  color?: string;
  reminderTime?: string;
  quickSteppers?: number[];
}

export interface UpdateHabitTrackerDto extends Partial<CreateHabitTrackerDto> {
  archived?: boolean;
}

export interface LogHabitEntryDto {
  date: string;
  value: number;
  durationSeconds?: number;
  note?: string;
}

export const habitApi = {
  createHabit: async (data: CreateHabitTrackerDto): Promise<HabitTracker> => {
    const res: any = await customInstance<HabitTracker>({ url: '/v1/habits', method: 'POST', data });
    return res?.data ?? res;
  },

  getHabits: async (category?: string): Promise<HabitTracker[]> => {
    const res: any = await customInstance<HabitTracker[]>({
      url: '/v1/habits',
      method: 'GET',
      params: category ? { category } : undefined,
    });
    return res?.data ?? res;
  },

  getDashboardSummary: async (): Promise<HabitDashboardSummary> => {
    const res: any = await customInstance<HabitDashboardSummary>({
      url: '/v1/habits/dashboard',
      method: 'GET',
    });
    return res?.data ?? res;
  },

  getHabitDetail: async (id: string): Promise<HabitDetail> => {
    const res: any = await customInstance<HabitDetail>({
      url: `/v1/habits/${id}`,
      method: 'GET',
    });
    return res?.data ?? res;
  },

  updateHabit: async (id: string, data: UpdateHabitTrackerDto): Promise<HabitTracker> => {
    const res: any = await customInstance<HabitTracker>({
      url: `/v1/habits/${id}`,
      method: 'PATCH',
      data,
    });
    return res?.data ?? res;
  },

  deleteHabit: async (id: string): Promise<{ id: string }> => {
    const res: any = await customInstance<{ id: string }>({
      url: `/v1/habits/${id}`,
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  logEntry: async (trackerId: string, data: LogHabitEntryDto): Promise<HabitEntry> => {
    const res: any = await customInstance<HabitEntry>({
      url: `/v1/habits/${trackerId}/entries`,
      method: 'POST',
      data,
    });
    return res?.data ?? res;
  },

  deleteEntry: async (trackerId: string, date: string): Promise<void> => {
    const res: any = await customInstance<void>({
      url: `/v1/habits/${trackerId}/entries/${date}`,
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  getCategories: async (): Promise<HabitCategory[]> => {
    const res: any = await customInstance<HabitCategory[]>({
      url: '/v1/habits/categories/list',
      method: 'GET',
    });
    return res?.data ?? res;
  },

  createCategory: async (data: { name: string; color?: string; icon?: string }): Promise<HabitCategory> => {
    const res: any = await customInstance<HabitCategory>({
      url: '/v1/habits/categories',
      method: 'POST',
      data,
    });
    return res?.data ?? res;
  },

  updateCategory: async (id: string, data: { name: string; color?: string; icon?: string }): Promise<HabitCategory> => {
    const res: any = await customInstance<HabitCategory>({
      url: `/v1/habits/categories/${id}`,
      method: 'PATCH',
      data,
    });
    return res?.data ?? res;
  },

  deleteCategory: async (id: string): Promise<{ id: string }> => {
    const res: any = await customInstance<{ id: string }>({
      url: `/v1/habits/categories/${id}`,
      method: 'DELETE',
    });
    return res?.data ?? res;
  },
};

export interface HabitCategory {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}
