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
import { habitApi, CreateHabitTrackerDto, HabitType, GoalDirection, GoalFrequency } from '@atlas/api-client';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from '@phosphor-icons/react';

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES = ['Health', 'Learning', 'Productivity', 'Lifestyle', 'Finance', 'Custom'];
const COLOR_OPTIONS = [
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'sky', bg: 'bg-sky-500' },
  { name: 'amber', bg: 'bg-amber-500' },
  { name: 'rose', bg: 'bg-rose-500' },
  { name: 'violet', bg: 'bg-violet-500' },
];

export function CreateHabitDialog({ open, onOpenChange, onSuccess }: CreateHabitDialogProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (values: CreateHabitTrackerDto) => habitApi.createHabit(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit tracker created successfully!');
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
      category: 'Health',
      type: 'BOOLEAN' as HabitType,
      goalValue: 1,
      goalUnit: '',
      goalFrequency: 'DAILY' as GoalFrequency,
      goalDirection: 'INCREASING' as GoalDirection,
      color: 'emerald',
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        toast.error('Habit name is required');
        return;
      }
      createMutation.mutate(value as CreateHabitTrackerDto);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border shadow-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Create Habit Tracker</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Set up a new tracker to monitor daily progress, streaks, and behaviors.
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
          <FieldGroup className="flex flex-col gap-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="habit-name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Tracker Name
                  </FieldLabel>
                  <Input
                    id="habit-name"
                    placeholder="e.g. Read Book, Smoking, LeetCode"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="mt-1 font-sans"
                  />
                </Field>
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
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
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
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOOLEAN">Boolean (Check / Cross)</SelectItem>
                        <SelectItem value="COUNT">Count (Counter Stepper)</SelectItem>
                        <SelectItem value="DURATION">Duration (Minutes/Hours)</SelectItem>
                        <SelectItem value="NUMERIC">Numeric (Value / Input)</SelectItem>
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
                      Goal Target Value
                    </FieldLabel>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 1)}
                      className="mt-1 font-mono"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="goalUnit">
                {(field) => (
                  <Field>
                    <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Unit (Optional)
                    </FieldLabel>
                    <Input
                      placeholder="e.g. pages, mins, cups"
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="mt-1 font-sans"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="goalDirection">
              {(field) => (
                <Field>
                  <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Goal Direction
                  </FieldLabel>
                  <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as GoalDirection)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCREASING">Increasing Goal (More is better e.g. Workout)</SelectItem>
                      <SelectItem value="DECREASING">Decreasing Goal (Less is better e.g. Smoking limit)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="color">
              {(field) => (
                <Field>
                  <FieldLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Accent Theme Color
                  </FieldLabel>
                  <div className="flex items-center gap-3 mt-2">
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
              {createMutation.isPending ? 'Creating...' : 'Create Tracker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
