'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { habitApi, HabitTracker } from '@atlas/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateHabitDialog } from './components/create-habit-dialog';
import { QuickCheckinDialog } from './components/quick-checkin-dialog';
import { HabitDetailSheet } from './components/habit-detail-sheet';
import { HabitHeatmap } from './components/habit-heatmap';
import { HabitCommandPalette } from './components/habit-command-palette';
import { HabitSidebarFilters } from './components/habit-sidebar-filters';
import { GlobalModuleLayout } from '@/components/global-module-layout';
import { toast } from 'sonner';
import {
  Plus,
  Flame,
  Check,
  Command,
  CalendarCheck,
  Lightning,
  Sparkle,
  BellRinging,
  SlidersHorizontal,
  FolderSimple,
} from '@phosphor-icons/react';

export function HabitDashboard() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQuickCheckinOpen, setIsQuickCheckinOpen] = useState(false);
  const [activeCheckinHabitId, setActiveCheckinHabitId] = useState<string | undefined>(undefined);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // TanStack Query for fetching dashboard summary
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['habit-dashboard'],
    queryFn: () => habitApi.getDashboardSummary(),
  });

  // 1-Tap Toggle Boolean / Quick Add Stepper Mutation
  const logMutation = useMutation({
    mutationFn: (variables: { trackerId: string; date: string; value: number }) =>
      habitApi.logEntry(variables.trackerId, { date: variables.date, value: variables.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit entry updated!');
    },
    onError: () => {
      toast.error('Failed to log habit entry');
    },
  });

  // Global Keyboard listener for Cmd+K / Ctrl+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickCheckinSingle = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCheckinHabitId(habitId);
    setIsQuickCheckinOpen(true);
  };

  const handle1TapToggleBoolean = (tracker: HabitTracker, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const isCompleted = tracker.isCompletedToday;
    const newValue = isCompleted ? 0 : 1;

    logMutation.mutate({
      trackerId: tracker.id,
      date: todayStr,
      value: newValue,
    });
  };

  const handleQuickAddValue = (tracker: HabitTracker, step: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const currentValue = tracker.todayEntry?.value || 0;
    const newValue = currentValue + step;

    logMutation.mutate({
      trackerId: tracker.id,
      date: todayStr,
      value: newValue,
    });
  };

  const filteredTrackers = (dashboardData?.trackers || []).filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category.toUpperCase() === selectedCategory.toUpperCase();
  });

  const categories = ['ALL', 'Health', 'Learning', 'Productivity', 'Lifestyle', 'Finance'];

  return (
    <GlobalModuleLayout
      moduleName="Habit"
      moduleBadge="v1.0"
      moduleSubtitle="Gustam Platform · Workspace"
      moduleInitial="H"
      sidebar={
        <HabitSidebarFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenCreate={() => setIsCreateOpen(true)}
          dashboardData={dashboardData}
        />
      }
    >
      {/* Cabinet & Ledger Style Page Header Card */}
      <div className="border border-brand-border bg-white dark:bg-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">
              Habit Workspace Overview
            </h2>
            <p className="text-xs text-brand-muted font-sans mt-1 max-w-xl">
              Track custom habits, daily behaviors, workouts, reading goals, and limit trackers with full year heatmaps and &lt;5s fast check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brand-border text-xs font-mono uppercase rounded-none py-1 px-2.5">
              <Sparkle className="size-3.5 text-emerald-500 mr-1" /> Fast Engine Active
            </Badge>
          </div>
        </div>

        {/* 3 Bento Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 border border-brand-border bg-brand-canvas/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-brand-muted tracking-wider">Today&apos;s Progress</span>
            <div className="text-2xl font-serif font-semibold text-brand-charcoal">
              {dashboardData ? `${Math.round(dashboardData.todayProgressRate)}%` : '0%'}
            </div>
            <p className="text-[11px] font-mono text-brand-muted">
              {dashboardData?.completedTodayCount || 0} of {dashboardData?.totalTrackers || 0} completed
            </p>
          </div>

          <div className="p-4 border border-brand-border bg-brand-canvas/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-brand-muted tracking-wider">Active Trackers</span>
            <div className="text-2xl font-serif font-semibold text-brand-charcoal">
              {dashboardData?.totalTrackers || 0}
            </div>
            <p className="text-[11px] font-mono text-brand-muted">
              Configured across {categories.length - 1} categories
            </p>
          </div>

          <div className="p-4 border border-brand-border bg-brand-canvas/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-brand-muted tracking-wider">Consistency Score</span>
            <div className="text-2xl font-serif font-semibold text-emerald-600 dark:text-emerald-400">
              High
            </div>
            <p className="text-[11px] font-mono text-brand-muted">
              TanStack Query &amp; Form Engine
            </p>
          </div>
        </div>
      </div>

      {/* 365-Day Aggregated Contribution Heatmap */}
      {dashboardData && (
        <HabitHeatmap
          data={dashboardData.aggregatedHeatmap}
          title="Atlas Habit — Full Year Aggregated Heatmap"
        />
      )}

      {/* Section Title & Filter Indicator */}
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-brand-charcoal" />
          <h3 className="font-serif text-lg font-medium text-brand-charcoal">
            {selectedCategory === 'ALL' ? 'All Habit Trackers' : `${selectedCategory} Trackers`}
          </h3>
        </div>

        <span className="text-xs font-mono text-brand-muted">
          Showing {filteredTrackers.length} Trackers
        </span>
      </div>

      {/* Trackers Grid (Cabinet & Ledger Card Style) */}
      {isLoading ? (
        <div className="py-20 text-center text-xs font-mono text-brand-muted animate-pulse border border-brand-border bg-white dark:bg-card">
          Loading custom habit trackers...
        </div>
      ) : filteredTrackers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-brand-border bg-white dark:bg-card space-y-3">
          <CalendarCheck className="size-10 mx-auto text-brand-muted" />
          <h3 className="font-serif text-base font-medium">No habit trackers found</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto font-mono">
            Create your custom habit tracker — track smoking, workouts, reading, water intake, or any custom habit!
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 mt-2 bg-brand-charcoal text-brand-canvas rounded-none font-mono text-xs"
          >
            <Plus className="size-4" /> Create Custom Tracker
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrackers.map((tracker) => {
            const isCompleted = tracker.isCompletedToday;
            const todayVal = tracker.todayEntry?.value || 0;
            const steppers = tracker.quickSteppers || [1, 5];

            return (
              <div
                key={tracker.id}
                onClick={() => setSelectedHabitId(tracker.id)}
                className="p-4 border border-brand-border bg-white dark:bg-card hover:border-brand-charcoal transition-all cursor-pointer space-y-4 flex flex-col justify-between group rounded-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{tracker.icon || '📌'}</span>
                      <span className="font-sans font-semibold text-sm text-brand-charcoal group-hover:underline">
                        {tracker.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-brand-border text-[9px] font-mono uppercase rounded-none px-1.5 py-0">
                        {tracker.category}
                      </Badge>
                      <span className="text-[11px] font-mono text-brand-muted">
                        Target: {tracker.goalDirection === 'DECREASING' ? '≤' : '≥'}{' '}
                        {tracker.goalValue} {tracker.goalUnit || 'unit'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={isCompleted ? 'default' : 'secondary'}
                      className={`text-[10px] font-mono gap-1 rounded-none ${
                        isCompleted ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'border border-brand-border'
                      }`}
                    >
                      {isCompleted ? <Check className="size-3" /> : null}
                      {isCompleted ? 'Completed' : 'Pending'}
                    </Badge>
                    {tracker.todayEntry && (
                      <span className="text-[10px] font-mono text-brand-muted font-bold">
                        Logged: {todayVal} {tracker.goalUnit || ''}
                      </span>
                    )}
                  </div>
                </div>

                {tracker.reminderTime && (
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <BellRinging className="size-3" /> Daily Reminder at {tracker.reminderTime}
                  </div>
                )}

                {/* Actions & Quick Steppers Input Bar */}
                <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-brand-muted flex items-center gap-1">
                    <Flame className="size-3.5 text-amber-500" />
                    Streak: {tracker.todayEntry ? 'Active' : '0 d'}
                  </span>

                  {tracker.type === 'BOOLEAN' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={isCompleted ? 'outline' : 'default'}
                      onClick={(e) => handle1TapToggleBoolean(tracker, e)}
                      disabled={logMutation.isPending}
                      className="h-8 gap-1.5 text-xs font-mono rounded-none"
                    >
                      <Check className="size-3.5" />
                      {isCompleted ? 'Done' : '1-Tap Log'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      {steppers.map((step) => (
                        <Button
                          key={step}
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={(e) => handleQuickAddValue(tracker, step, e)}
                          disabled={logMutation.isPending}
                          className="h-7 px-2 text-[11px] font-mono font-semibold rounded-none border border-brand-border"
                        >
                          +{step}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleQuickCheckinSingle(tracker.id, e)}
                        className="h-7 px-2 text-[11px] font-mono rounded-none border-brand-border"
                      >
                        Log &gt;
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Command Palette */}
      <HabitCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        trackers={dashboardData?.trackers || []}
        onSelectHabitCheckin={(habitId) => {
          setActiveCheckinHabitId(habitId);
          setIsQuickCheckinOpen(true);
        }}
        onOpenCreateDialog={() => setIsCreateOpen(true)}
        onFilterCategory={(cat) => setSelectedCategory(cat)}
      />

      <CreateHabitDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <QuickCheckinDialog
        open={isQuickCheckinOpen}
        onOpenChange={setIsQuickCheckinOpen}
        trackers={dashboardData?.trackers || []}
        selectedTrackerId={activeCheckinHabitId || undefined}
      />

      <HabitDetailSheet
        open={!!selectedHabitId}
        onOpenChange={(open) => !open && setSelectedHabitId(null)}
        habitId={selectedHabitId}
      />
    </GlobalModuleLayout>
  );
}
