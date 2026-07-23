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
import { Flame, Trophy, Percent, Trash, Note } from '@phosphor-icons/react';

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

            {/* Key Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Flame className="size-5 text-amber-500 mb-1" />
                <span className="text-xs font-mono uppercase text-muted-foreground">Streak</span>
                <span className="text-xl font-bold font-mono tracking-tight">{detail.stats.currentStreak} d</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Trophy className="size-5 text-emerald-500 mb-1" />
                <span className="text-xs font-mono uppercase text-muted-foreground">Best</span>
                <span className="text-xl font-bold font-mono tracking-tight">{detail.stats.longestStreak} d</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                <Percent className="size-5 text-sky-500 mb-1" />
                <span className="text-xs font-mono uppercase text-muted-foreground">Rate</span>
                <span className="text-xl font-bold font-mono tracking-tight">{detail.stats.completionRate}%</span>
              </div>
            </div>

            {/* 365-Day Contribution Heatmap */}
            <div className="space-y-2">
              <HabitHeatmap
                data={detail.stats.heatmapData}
                goalDirection={detail.goalDirection}
                title={`${detail.name} — Full Year Activity`}
              />
            </div>

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
