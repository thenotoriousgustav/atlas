'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@atlas/ui/components/sheet';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { habitApi } from '@atlas/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HabitHeatmap } from './habit-heatmap';
import { toast } from 'sonner';
import { Flame, Trophy, Calendar, ChartLineUp, Trash, Note, ChartBar } from '@phosphor-icons/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@atlas/ui/components/tabs';
import { HabitTrendChart, HabitMonthlyBarChart } from './habit-charts';

interface HabitDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitId?: string | null;
  onRefresh?: () => void;
}

export function HabitDetailSheet({ open, onOpenChange, habitId, onRefresh }: HabitDetailSheetProps) {
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['habit-detail', habitId],
    queryFn: () => habitApi.getHabitDetail(habitId!),
    enabled: open && !!habitId,
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => habitApi.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit tracker deleted');
      if (onRefresh) onRefresh();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to delete habit tracker');
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: ({ trackerId, date }: { trackerId: string; date: string }) =>
      habitApi.deleteEntry(trackerId, date),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habit-detail', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      toast.success(`Entry for ${variables.date} removed`);
      if (onRefresh) onRefresh();
    },
    onError: () => {
      toast.error('Failed to remove entry');
    },
  });

  const handleDeleteHabit = () => {
    if (!habitId) return;
    if (confirm('Are you sure you want to delete this habit tracker?')) {
      deleteHabitMutation.mutate(habitId);
    }
  };

  const handleDeleteEntry = (date: string) => {
    if (!habitId) return;
    deleteEntryMutation.mutate({ trackerId: habitId, date });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background p-6 space-y-6">
        {isLoading || !detail ? (
          <div className="py-20 text-center text-sm font-mono text-muted-foreground animate-pulse">
            Loading habit analytics via TanStack Query...
          </div>
        ) : (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
                  {detail.category}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono uppercase">
                  {detail.type} • {detail.goalDirection}
                </Badge>
              </div>

              <SheetTitle className="text-2xl font-bold tracking-tight">{detail.name}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Target: {detail.goalValue} {detail.goalUnit || 'units'} per {detail.goalFrequency.toLowerCase()}
              </SheetDescription>
            </SheetHeader>

            {/* 4 Key Stats Cards (Section 6) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Flame className="size-4 text-amber-500 mb-1" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Current Streak</span>
                <span className="text-lg font-bold font-mono tracking-tight text-amber-500">
                  {detail.stats.currentStreak} d
                </span>
                <span className="text-[10px] text-muted-foreground font-sans line-clamp-1 mt-0.5">
                  {detail.stats.streakLabel}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <ChartLineUp className="size-4 text-sky-500 mb-1" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Monthly Avg</span>
                <span className="text-lg font-bold font-mono tracking-tight text-sky-500">
                  {detail.stats.monthlyAverage || '0'}
                </span>
                <span className="text-[10px] text-muted-foreground font-sans mt-0.5">this month</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Calendar className="size-4 text-purple-500 mb-1" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Best Month</span>
                <span className="text-lg font-bold font-mono tracking-tight text-purple-500">
                  {detail.stats.bestMonth || '-'}
                </span>
                <span className="text-[10px] text-muted-foreground font-sans mt-0.5">top avg performance</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Trophy className="size-4 text-emerald-500 mb-1" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Longest Streak</span>
                <span className="text-lg font-bold font-mono tracking-tight text-emerald-500">
                  {detail.stats.longestStreak} d
                </span>
                <span className="text-[10px] text-muted-foreground font-sans mt-0.5">all-time record</span>
              </div>
            </div>

            {/* Interactive Charts & Analytics Tabs (Section 7) */}
            <Tabs defaultValue="heatmap" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-muted/60">
                <TabsTrigger value="heatmap" className="text-xs font-mono gap-1">
                  <Calendar className="size-3.5" /> Heatmap
                </TabsTrigger>
                <TabsTrigger value="trend" className="text-xs font-mono gap-1">
                  <ChartLineUp className="size-3.5" /> Trend
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs font-mono gap-1">
                  <ChartBar className="size-3.5" /> Monthly
                </TabsTrigger>
              </TabsList>

              <TabsContent value="heatmap" className="mt-3">
                <HabitHeatmap
                  data={detail.stats.heatmapData}
                  goalDirection={detail.goalDirection}
                  title={`${detail.name} — Full Year Activity`}
                />
              </TabsContent>

              <TabsContent value="trend" className="mt-3">
                <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Daily Log Progression vs Goal
                    </span>
                  </div>
                  <HabitTrendChart
                    data={detail.stats.trendChartData}
                    goalValue={detail.goalValue}
                    goalUnit={detail.goalUnit}
                  />
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-3">
                <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Monthly Average Comparison
                    </span>
                  </div>
                  <HabitMonthlyBarChart
                    data={detail.stats.monthlyChartData}
                    goalUnit={detail.goalUnit}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Recent History Entries List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Recent Check-in Logs ({detail.entries.length})
              </h4>

              {detail.entries.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
                  No check-in entries logged yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {detail.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-mono font-medium">
                          <span>{entry.date}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-primary font-bold">
                            {entry.value} {detail.goalUnit || 'logs'}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Note className="size-3" /> {entry.note}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteEntry(entry.date)}
                        disabled={deleteEntryMutation.isPending}
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SheetFooter className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={handleDeleteHabit}
                disabled={deleteHabitMutation.isPending}
              >
                <Trash className="size-4" /> {deleteHabitMutation.isPending ? 'Deleting...' : 'Delete Tracker'}
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
