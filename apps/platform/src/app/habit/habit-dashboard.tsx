'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { habitApi, HabitTracker } from '@atlas/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateHabitDialog } from './components/create-habit-dialog';
import { QuickCheckinDialog } from './components/quick-checkin-dialog';
import { HabitDetailSheet } from './components/habit-detail-sheet';
import { HabitHeatmap } from './components/habit-heatmap';
import { HabitCommandPalette } from './components/habit-command-palette';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import {
  Plus,
  Flame,
  Check,
  Command,
  ArrowLeft,
  CalendarCheck,
  Lightning,
  Sparkle,
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

  // 1-Tap Toggle Boolean Mutation
  const toggleBooleanMutation = useMutation({
    mutationFn: (variables: { trackerId: string; date: string; value: number }) =>
      habitApi.logEntry(variables.trackerId, { date: variables.date, value: variables.value }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success(variables.value === 1 ? 'Habit marked as completed' : 'Habit marked as incomplete');
    },
    onError: () => {
      toast.error('Failed to update habit status');
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

    toggleBooleanMutation.mutate({
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-5 text-emerald-500 font-bold" />
              <h1 className="text-lg font-bold tracking-tight font-sans">Atlas Habit</h1>
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                v1.0
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="gap-2 text-xs font-mono"
            >
              <Command className="size-3.5 text-muted-foreground" />
              <span>Command Palette</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-muted border border-border rounded">
                ⌘K
              </kbd>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 bg-primary text-primary-foreground font-medium text-xs"
            >
              <Plus className="size-4" />
              <span>New Tracker</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Bento Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono uppercase tracking-wider">Today&apos;s Progress</span>
              <Lightning className="size-4 text-amber-500" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono tracking-tight">
                {dashboardData ? `${Math.round(dashboardData.todayProgressRate)}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData?.completedTodayCount || 0} of {dashboardData?.totalTrackers || 0} habits completed today
              </p>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${dashboardData?.todayProgressRate || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono uppercase tracking-wider">Active Trackers</span>
              <CalendarCheck className="size-4 text-sky-500" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono tracking-tight">
                {dashboardData?.totalTrackers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configured across {categories.length - 1} categories
              </p>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
              <Sparkle className="size-3 text-emerald-500" /> Fast &lt; 5s check-in &amp; cmdk palette
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono uppercase tracking-wider">Behavior Consistency</span>
              <Flame className="size-4 text-rose-500" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono tracking-tight">High</div>
              <p className="text-xs text-muted-foreground mt-1">
                Powered by TanStack Query &amp; Form
              </p>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Non-judgmental habit &amp; behavior log
            </div>
          </div>
        </div>

        {/* Aggregated Heatmap Overview */}
        {dashboardData && (
          <HabitHeatmap
            data={dashboardData.aggregatedHeatmap}
            title="Atlas Habit — Full Year Aggregated Activity Heatmap"
          />
        )}

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-border">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory.toUpperCase() === cat.toUpperCase()
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-muted-foreground hidden sm:inline-block">
            {filteredTrackers.length} Trackers
          </span>
        </div>

        {/* Trackers Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-sm font-mono text-muted-foreground animate-pulse">
            Loading habit trackers via TanStack Query...
          </div>
        ) : filteredTrackers.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl space-y-3">
            <CalendarCheck className="size-10 mx-auto text-muted-foreground" />
            <h3 className="text-base font-semibold">No habit trackers found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven&apos;t added any habit trackers in this category yet. Create your first tracker to start logging daily habits.
            </p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 mt-2">
              <Plus className="size-4" /> Create Tracker
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrackers.map((tracker) => {
              const isCompleted = tracker.isCompletedToday;
              return (
                <div
                  key={tracker.id}
                  onClick={() => setSelectedHabitId(tracker.id)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm font-sans group-hover:text-primary transition-colors">
                          {tracker.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                          {tracker.category}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        Goal: {tracker.goalValue} {tracker.goalUnit || 'unit'} ({tracker.type})
                      </p>
                    </div>

                    <Badge
                      variant={isCompleted ? 'default' : 'secondary'}
                      className={`text-[11px] font-mono gap-1 ${
                        isCompleted ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''
                      }`}
                    >
                      {isCompleted ? <Check className="size-3" /> : null}
                      {isCompleted ? 'Done Today' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Actions & Quick Input Bar */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Flame className="size-3.5 text-amber-500" />
                      Streak: {tracker.todayEntry ? 'Active' : '0 d'}
                    </span>

                    {tracker.type === 'BOOLEAN' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={isCompleted ? 'outline' : 'default'}
                        onClick={(e) => handle1TapToggleBoolean(tracker, e)}
                        disabled={toggleBooleanMutation.isPending}
                        className="h-8 gap-1.5 text-xs font-mono"
                      >
                        <Check className="size-3.5" />
                        {isCompleted ? 'Completed' : '1-Tap Log'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleQuickCheckinSingle(tracker.id, e)}
                        className="h-8 gap-1.5 text-xs font-mono"
                      >
                        <Plus className="size-3.5" /> Log Check-in
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
    </div>
  );
}
