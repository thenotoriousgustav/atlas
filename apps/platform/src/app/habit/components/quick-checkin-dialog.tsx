'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import { Field, FieldGroup, FieldLabel } from '@atlas/ui/components/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@atlas/ui/components/select';
import { habitApi, HabitTracker, LogHabitEntryDto } from '@atlas/api-client';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Plus, Minus, Play, Pause, NotePencil, BellRinging } from '@phosphor-icons/react';

interface QuickCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackers: HabitTracker[];
  selectedTrackerId?: string;
  onSuccess?: () => void;
}

export function QuickCheckinDialog({
  open,
  onOpenChange,
  trackers,
  selectedTrackerId,
  onSuccess,
}: QuickCheckinDialogProps) {
  const queryClient = useQueryClient();
  const [activeTrackerId, setActiveTrackerId] = useState<string>('');

  // Timer state for Duration habits
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (selectedTrackerId) {
      setActiveTrackerId(selectedTrackerId);
    } else if (trackers.length > 0 && trackers[0] && !activeTrackerId) {
      setActiveTrackerId(trackers[0].id);
    }
  }, [selectedTrackerId, trackers, activeTrackerId]);

  const activeTracker = trackers.find((t) => t.id === activeTrackerId);

  const logMutation = useMutation({
    mutationFn: (values: { trackerId: string; dto: LogHabitEntryDto }) =>
      habitApi.logEntry(values.trackerId, values.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-detail', activeTrackerId] });
      toast.success(`Check-in logged for ${activeTracker?.name || 'habit'}!`);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to log check-in');
    },
  });

  const form = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0] || '',
      value: 1,
      note: '',
    },
    onSubmit: async ({ value }) => {
      if (!activeTrackerId) {
        toast.error('Please select a habit tracker');
        return;
      }
      const finalValue =
        activeTracker?.type === 'DURATION' ? Math.max(1, Math.round(elapsedSeconds / 60)) : value.value;

      logMutation.mutate({
        trackerId: activeTrackerId,
        dto: {
          date: value.date,
          value: finalValue,
          durationSeconds: activeTracker?.type === 'DURATION' ? elapsedSeconds : undefined,
          note: value.note.trim() || undefined,
        },
      });
    },
  });

  // Update initial form values when active tracker changes
  useEffect(() => {
    if (activeTracker) {
      if (activeTracker.todayEntry) {
        form.setFieldValue('value', activeTracker.todayEntry.value);
        form.setFieldValue('note', activeTracker.todayEntry.note || '');
        if (activeTracker.todayEntry.durationSeconds) {
          setElapsedSeconds(activeTracker.todayEntry.durationSeconds);
        }
      } else {
        form.setFieldValue('value', activeTracker.type === 'BOOLEAN' ? 1 : 1);
        form.setFieldValue('note', '');
        setElapsedSeconds(0);
      }
    }
  }, [activeTrackerId, activeTracker]);

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const steppers = activeTracker?.quickSteppers || [1, 5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-background border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold tracking-tight">Fast Daily Check-in</DialogTitle>
            <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
              &lt; 5s Speed Engine
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Log custom habit progress with instant stepper shortcuts.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 pt-2"
        >
          <FieldGroup className="flex flex-col gap-3">
            <Field>
              <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Select Habit Tracker
              </FieldLabel>
              <Select value={activeTrackerId} onValueChange={setActiveTrackerId}>
                <SelectTrigger className="mt-1 font-medium">
                  <SelectValue placeholder="Choose habit..." />
                </SelectTrigger>
                <SelectContent>
                  {trackers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon ? `${t.icon} ` : ''}{t.name} ({t.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {activeTracker && (
              <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{activeTracker.icon || '📌'}</span>
                    <span className="text-xs font-semibold">{activeTracker.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground text-right">
                    <span>
                      Target: {activeTracker.goalDirection === 'DECREASING' ? '≤' : '≥'}{' '}
                      {activeTracker.goalValue} {activeTracker.goalUnit || 'unit'}
                    </span>
                    {activeTracker.reminderTime && (
                      <div className="flex items-center justify-end gap-1 text-amber-500">
                        <BellRinging className="size-3" /> {activeTracker.reminderTime}
                      </div>
                    )}
                  </div>
                </div>

                <form.Field name="value">
                  {(field) => (
                    <>
                      {activeTracker.type === 'BOOLEAN' && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={field.state.value >= 1 ? 'default' : 'outline'}
                            className="flex-1 gap-2"
                            onClick={() => field.handleChange(field.state.value >= 1 ? 0 : 1)}
                          >
                            <Check className="size-4" />
                            {field.state.value >= 1 ? 'Completed Today' : 'Mark as Complete'}
                          </Button>
                        </div>
                      )}

                      {(activeTracker.type === 'COUNT' || activeTracker.type === 'NUMERIC') && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-9"
                              onClick={() => field.handleChange(Math.max(0, field.state.value - 1))}
                            >
                              <Minus className="size-4" />
                            </Button>

                            <Input
                              type="number"
                              step="any"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                              className="text-center font-mono text-lg font-bold h-9"
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-9"
                              onClick={() => field.handleChange(field.state.value + 1)}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>

                          {/* Quick Stepper Shortcut Buttons (e.g. +1, +5) */}
                          <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/40">
                            <span className="text-[10px] font-mono text-muted-foreground mr-1">Quick Add:</span>
                            {steppers.map((step) => (
                              <Button
                                key={step}
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-7 px-2.5 text-xs font-mono font-semibold"
                                onClick={() => field.handleChange(field.state.value + step)}
                              >
                                +{step} {activeTracker.goalUnit || ''}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </form.Field>

                {activeTracker.type === 'DURATION' && (
                  <div className="space-y-2 text-center">
                    <div className="text-3xl font-mono font-bold tracking-tight">
                      {formatTimer(elapsedSeconds)}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant={isTimerRunning ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="gap-2"
                      >
                        {isTimerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                        {isTimerRunning ? 'Pause Timer' : 'Start Timer'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form.Field name="note">
              {(field) => (
                <Field>
                  <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <NotePencil className="size-3.5" /> Note (Optional)
                  </FieldLabel>
                  <Input
                    placeholder="e.g. Completed session, feel good"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">
              Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border">Enter</kbd> to save
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={logMutation.isPending || !activeTrackerId}>
                {logMutation.isPending ? 'Saving...' : 'Save Check-in'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
