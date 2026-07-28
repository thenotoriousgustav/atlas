import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHabitTrackerDto, GoalDirection } from './dto/create-habit-tracker.dto';
import { UpdateHabitTrackerDto } from './dto/update-habit-tracker.dto';
import { LogHabitEntryDto } from './dto/log-habit-entry.dto';

@Injectable()
export class HabitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateHabitTrackerDto) {
    return this.prisma.habitTracker.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon,
        category: dto.category ?? 'General',
        type: dto.type ?? 'BOOLEAN',
        goalValue: dto.goalValue ?? 1,
        goalUnit: dto.goalUnit,
        goalFrequency: dto.goalFrequency ?? 'DAILY',
        goalDirection: dto.goalDirection ?? 'INCREASING',
        color: dto.color ?? 'emerald',
        reminderTime: dto.reminderTime,
        quickSteppers: dto.quickSteppers && dto.quickSteppers.length > 0 ? dto.quickSteppers : [1, 5],
      },
    });
  }

  async findAll(userId: string, category?: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const trackers = await this.prisma.habitTracker.findMany({
      where: {
        userId,
        archived: false,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      include: {
        entries: {
          where: { date: todayStr },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return trackers.map((t) => {
      const todayEntry = t.entries[0] || null;
      const isCompletedToday = todayEntry
        ? t.goalDirection === GoalDirection.DECREASING
          ? todayEntry.value <= t.goalValue
          : todayEntry.value >= t.goalValue
        : false;

      return {
        ...t,
        todayEntry,
        isCompletedToday,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const tracker = await this.prisma.habitTracker.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        entries: {
          orderBy: { date: 'desc' },
          take: 365,
        },
      },
    });

    if (!tracker) {
      throw new NotFoundException(`Habit tracker with ID ${id} not found`);
    }

    const stats = this.calculateStats(tracker, tracker.entries);

    return {
      ...tracker,
      stats,
    };
  }

  async update(userId: string, id: string, dto: UpdateHabitTrackerDto) {
    await this.findOne(userId, id);

    return this.prisma.habitTracker.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.habitTracker.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async logEntry(userId: string, trackerId: string, dto: LogHabitEntryDto) {
    const tracker = await this.prisma.habitTracker.findFirst({
      where: { id: trackerId, userId, deletedAt: null },
    });

    if (!tracker) {
      throw new NotFoundException(`Habit tracker with ID ${trackerId} not found`);
    }

    return this.prisma.habitEntry.upsert({
      where: {
        trackerId_date: {
          trackerId,
          date: dto.date,
        },
      },
      create: {
        trackerId,
        date: dto.date,
        value: dto.value,
        durationSeconds: dto.durationSeconds,
        note: dto.note,
      },
      update: {
        value: dto.value,
        durationSeconds: dto.durationSeconds,
        note: dto.note,
      },
    });
  }

  async deleteEntry(userId: string, trackerId: string, date: string) {
    const tracker = await this.prisma.habitTracker.findFirst({
      where: { id: trackerId, userId, deletedAt: null },
    });

    if (!tracker) {
      throw new NotFoundException(`Habit tracker with ID ${trackerId} not found`);
    }

    return this.prisma.habitEntry.delete({
      where: {
        trackerId_date: {
          trackerId,
          date,
        },
      },
    });
  }

  async getDashboardSummary(userId: string) {
    const trackers = await this.findAll(userId);

    const oneYearAgoDate = new Date();
    oneYearAgoDate.setDate(oneYearAgoDate.getDate() - 365);
    const oneYearAgoStr = oneYearAgoDate.toISOString().split('T')[0];

    const allEntries = await this.prisma.habitEntry.findMany({
      where: {
        tracker: { userId, deletedAt: null, archived: false },
        date: { gte: oneYearAgoStr },
      },
    });

    const totalTrackers = trackers.length;
    const completedTodayCount = trackers.filter((t) => t.isCompletedToday).length;
    const todayProgressRate = totalTrackers > 0 ? Math.round((completedTodayCount / totalTrackers) * 100) : 0;

    // Aggregate daily activity counts for heatmap across ALL habits
    const dateCountMap = new Map<string, number>();
    for (const entry of allEntries) {
      const current = dateCountMap.get(entry.date) || 0;
      dateCountMap.set(entry.date, current + 1);
    }

    const aggregatedHeatmap: Array<{ date: string; count: number; level: number }> = [];
    dateCountMap.forEach((count, date) => {
      let level = 0;
      if (count >= 4) level = 4;
      else if (count === 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;
      aggregatedHeatmap.push({ date, count, level });
    });

    // Category Distribution (Pie / Radar)
    const categoryCountMap = new Map<string, number>();
    trackers.forEach((t) => {
      const cat = t.category || 'General';
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
    });

    const categoryDistribution: Array<{ category: string; count: number; percentage: number }> = [];
    categoryCountMap.forEach((count, category) => {
      const percentage = totalTrackers > 0 ? Math.round((count / totalTrackers) * 100) : 0;
      categoryDistribution.push({ category, count, percentage });
    });

    // Weekly Trend (last 14 days)
    const weeklyTrend: Array<{ date: string; completed: number; total: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      let completedCount = 0;
      trackers.forEach((t) => {
        const entry = allEntries.find((e) => e.trackerId === t.id && e.date === dateStr);
        if (entry) {
          const isDone =
            t.goalDirection === GoalDirection.DECREASING
              ? entry.value <= t.goalValue
              : entry.value >= t.goalValue;
          if (isDone) completedCount++;
        }
      });

      weeklyTrend.push({
        date: dateStr,
        completed: completedCount,
        total: totalTrackers,
      });
    }

    return {
      totalTrackers,
      completedTodayCount,
      todayProgressRate,
      trackers,
      aggregatedHeatmap,
      categoryDistribution,
      weeklyTrend,
    };
  }

  // ponytail: helper method to compute streaks & stats
  private calculateStats(tracker: any, entries: any[]) {
    const entryMap = new Map<string, any>(entries.map((e) => [e.date, e]));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    let checkDate = new Date(today);

    // Check current streak backwards from today or yesterday
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const entry = entryMap.get(dateStr);
      const isSuccess = entry
        ? tracker.goalDirection === GoalDirection.DECREASING
          ? entry.value <= tracker.goalValue
          : entry.value >= tracker.goalValue
        : false;

      if (isSuccess) {
        currentStreak++;
      } else {
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Longest streak calculation over entries sorted ascending
    const sortedDates = Array.from(entryMap.keys()).sort();
    tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const entry = entryMap.get(dStr);
      const isSuccess = entry
        ? tracker.goalDirection === GoalDirection.DECREASING
          ? entry.value <= tracker.goalValue
          : entry.value >= tracker.goalValue
        : false;

      if (isSuccess) {
        const currentDate = new Date(dStr);
        if (prevDate) {
          const diffDays = Math.round(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24),
          );
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = currentDate;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        prevDate = null;
      }
    }

    // Prepare heatmap level 0-4
    const heatmapData = entries.map((e) => {
      let level = 0;
      if (tracker.goalDirection === GoalDirection.DECREASING) {
        if (e.value <= tracker.goalValue) level = 1;
        else if (e.value <= tracker.goalValue * 1.5) level = 2;
        else if (e.value <= tracker.goalValue * 2) level = 3;
        else level = 4;
      } else {
        const ratio = tracker.goalValue > 0 ? e.value / tracker.goalValue : e.value;
        if (ratio >= 1.5) level = 4;
        else if (ratio >= 1) level = 3;
        else if (ratio >= 0.5) level = 2;
        else if (ratio > 0) level = 1;
        else level = 0;
      }
      return {
        date: e.date,
        count: Math.round(e.value),
        level,
      };
    });

    // Calculate Monthly Averages & Best Month
    const monthlyGroups = new Map<string, { totalVal: number; count: number; successes: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    entries.forEach((e) => {
      const yearMonth = e.date.substring(0, 7); // "YYYY-MM"
      const group = monthlyGroups.get(yearMonth) || { totalVal: 0, count: 0, successes: 0 };
      group.totalVal += e.value;
      group.count += 1;

      const isSuccess =
        tracker.goalDirection === GoalDirection.DECREASING
          ? e.value <= tracker.goalValue
          : e.value >= tracker.goalValue;
      if (isSuccess) group.successes += 1;

      monthlyGroups.set(yearMonth, group);
    });

    const currentMonthKey = today.toISOString().substring(0, 7);
    const currentMonthGroup = monthlyGroups.get(currentMonthKey);
    const monthlyAverageNum =
      currentMonthGroup && currentMonthGroup.count > 0
        ? Math.round((currentMonthGroup.totalVal / currentMonthGroup.count) * 10) / 10
        : 0;
    const monthlyAverage = `${monthlyAverageNum}${tracker.goalUnit ? ' ' + tracker.goalUnit : ''}/day`;

    let bestMonth = '-';
    let bestScore = tracker.goalDirection === GoalDirection.DECREASING ? Infinity : -1;

    monthlyGroups.forEach((group, yearMonth) => {
      const [year, month] = yearMonth.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = `${monthNames[monthIdx]}`;
      const avg = group.totalVal / group.count;

      if (tracker.goalDirection === GoalDirection.DECREASING) {
        if (avg < bestScore) {
          bestScore = avg;
          bestMonth = monthName;
        }
      } else {
        if (avg > bestScore) {
          bestScore = avg;
          bestMonth = monthName;
        }
      }
    });

    const streakLabel =
      tracker.goalDirection === GoalDirection.DECREASING
        ? `${currentStreak} days under target`
        : `${currentStreak} days streak`;

    const sortedMonths = Array.from(monthlyGroups.keys()).sort();
    const monthlyChartData = sortedMonths.map((ym) => {
      const [year, month] = ym.split('-');
      const mIdx = parseInt(month, 10) - 1;
      const grp = monthlyGroups.get(ym)!;
      return {
        month: `${monthNames[mIdx]} '${year.substring(2)}`,
        average: Math.round((grp.totalVal / grp.count) * 10) / 10,
        goal: tracker.goalValue,
        total: grp.count,
      };
    });

    const trendChartData = [...entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((e) => ({
        date: e.date,
        value: e.value,
        goal: tracker.goalValue,
      }));

    const completionRate = entries.length > 0 ? Math.round((entries.length / 30) * 100) : 0;

    return {
      currentStreak,
      streakLabel,
      longestStreak,
      monthlyAverage,
      monthlyAverageNum,
      bestMonth,
      totalEntries: entries.length,
      completionRate: Math.min(completionRate, 100),
      heatmapData,
      monthlyChartData,
      trendChartData,
    };
  }

  async getCategories(userId: string) {
    const customCats = await this.prisma.habitCategory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (customCats.length === 0) {
      const defaults = [
        { name: 'Health', color: 'emerald', icon: 'FolderSimple' },
        { name: 'Learning', color: 'sky', icon: 'FolderSimple' },
        { name: 'Productivity', color: 'amber', icon: 'FolderSimple' },
        { name: 'Lifestyle', color: 'rose', icon: 'FolderSimple' },
        { name: 'Finance', color: 'violet', icon: 'FolderSimple' },
      ];
      for (const d of defaults) {
        await this.prisma.habitCategory.create({
          data: { userId, name: d.name, color: d.color, icon: d.icon },
        });
      }
      return this.prisma.habitCategory.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return customCats;
  }

  async createCategory(userId: string, dto: { name: string; color?: string; icon?: string }) {
    return this.prisma.habitCategory.create({
      data: {
        userId,
        name: dto.name.trim(),
        color: dto.color ?? 'emerald',
        icon: dto.icon ?? 'FolderSimple',
      },
    });
  }

  async updateCategory(userId: string, id: string, dto: { name: string; color?: string; icon?: string }) {
    return this.prisma.habitCategory.update({
      where: { id, userId },
      data: {
        name: dto.name.trim(),
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async deleteCategory(userId: string, id: string) {
    return this.prisma.habitCategory.delete({
      where: { id, userId },
    });
  }
}
