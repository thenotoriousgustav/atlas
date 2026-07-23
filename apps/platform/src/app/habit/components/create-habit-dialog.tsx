'use client';

import React from 'react';
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
import { habitApi, CreateHabitTrackerDto, HabitType, GoalDirection, GoalFrequency, HabitCategory } from '@atlas/api-client';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from '@phosphor-icons/react';

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EMOJI_SUGGESTIONS = ['🚬', '🏋️', '📚', '💧', '💻', '☕', '🛏️', '🧘', '🚴', '💰', '🎨', '🧪'];
const COLOR_OPTIONS = [
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'sky', bg: 'bg-sky-500' },
  { name: 'amber', bg: 'bg-amber-500' },
  { name: 'rose', bg: 'bg-rose-500' },
  { name: 'violet', bg: 'bg-violet-500' },
  { name: 'orange', bg: 'bg-orange-500' },
  { name: 'teal', bg: 'bg-teal-500' },
  { name: 'pink', bg: 'bg-pink-500' },
];

export function CreateHabitDialog({ open, onOpenChange, onSuccess }: CreateHabitDialogProps) {
  const queryClient = useQueryClient();

  const { data: userCategories = [] } = useQuery<HabitCategory[]>({
    queryKey: ['habit-categories'],
    queryFn: () => habitApi.getCategories(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateHabitTrackerDto) => habitApi.createHabit(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Flexible habit tracker created successfully!');
      if (onSuccess) onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create habit tracker');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      icon: '⚡',
      category: 'Health',
      type: 'COUNT' as HabitType,
      goalValue: 5,
      goalUnit: 'times',
      goalFrequency: 'DAILY' as GoalFrequency,
      goalDirection: 'DECREASING' as GoalDirection,
      color: 'rose',
      reminderTime: '21:00',
      quickSteppersStr: '1, 5',
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        toast.error('Habit name is required');
        return;
      }

      const quickSteppers = value.quickSteppersStr
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);

      createMutation.mutate({
        name: value.name.trim(),
        icon: value.icon || '📌',
        category: value.category,
        type: value.type,
        goalValue: value.goalValue,
        goalUnit: value.goalUnit.trim() || undefined,
        goalFrequency: value.goalFrequency,
        goalDirection: value.goalDirection,
        color: value.color,
        reminderTime: value.reminderTime || undefined,
        quickSteppers: quickSteppers.length > 0 ? quickSteppers : [1, 5],
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto bg-background border-border shadow-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Create Custom Habit Tracker</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Fully flexible habit configuration — track smoking, workouts, reading, water intake, or any custom behavior.
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
          <FieldGroup className="flex flex-col gap-3.5">
            {/* Icon & Name */}
            <div className="grid grid-cols-4 gap-3">
              <form.Field name="icon">
                {(field) => (
                  <Field className="col-span-1">
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Icon
                    </FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="🚬"
                      className="mt-1 text-center font-mono text-base h-9"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="name">
                {(field) => (
                  <Field className="col-span-3">
                    <FieldLabel htmlFor="habit-name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Habit / Tracker Name
                    </FieldLabel>
                    <Input
                      id="habit-name"
                      placeholder="e.g. Smoking, Membaca, Workout, Water"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="mt-1 font-sans h-9"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Quick Icon Suggestion Pills */}
            <form.Field name="icon">
              {(field) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1">Quick icons:</span>
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => field.handleChange(emoji)}
                      className={`text-sm p-1 rounded hover:bg-muted transition-colors ${
                        field.state.value === emoji ? 'bg-muted ring-1 ring-border' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="category">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Category
                    </FieldLabel>
                    <Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCategories.length > 0 ? (
                          userCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Health">Health</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="type">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Tracker Type
                    </FieldLabel>
                    <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as HabitType)}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOOLEAN">Boolean (1-Tap Check/Uncheck)</SelectItem>
                        <SelectItem value="COUNT">Count (Stepper / Increments)</SelectItem>
                        <SelectItem value="DURATION">Duration (Minutes / Timer)</SelectItem>
                        <SelectItem value="NUMERIC">Numeric (Value Input)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="goalValue">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Target Goal Value
                    </FieldLabel>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 1)}
                      className="mt-1 font-mono h-9"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="goalUnit">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Unit (Satuan)
                    </FieldLabel>
                    <Input
                      placeholder="e.g. batang, halaman, liter, menit"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="mt-1 font-sans h-9"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="goalDirection">
              {(field) => (
                <Field>
                  <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Heatmap &amp; Goal Logic
                  </FieldLabel>
                  <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as GoalDirection)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCREASING">Increasing Goal (Semakin banyak semakin hijau e.g. Workout, Read)</SelectItem>
                      <SelectItem value="DECREASING">Reverse Heatmap — Decreasing (Semakin sedikit semakin hijau e.g. Smoking limit)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="reminderTime">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Daily Reminder Time
                    </FieldLabel>
                    <Input
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="mt-1 font-mono h-9"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="quickSteppersStr">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Quick Input Buttons
                    </FieldLabel>
                    <Input
                      placeholder="e.g. 1, 5"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="mt-1 font-mono h-9"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="color">
              {(field) => (
                <Field>
                  <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Accent Color Theme
                  </FieldLabel>
                  <div className="flex items-center gap-2.5 mt-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => field.handleChange(c.name)}
                        className={`size-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                          field.state.value === c.name ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {field.state.value === c.name && <Check className="size-4 text-white font-bold" />}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground">
              {createMutation.isPending ? 'Creating...' : 'Create Habit Tracker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
