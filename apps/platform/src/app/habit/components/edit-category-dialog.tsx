'use client';

import React, { useEffect, useState } from 'react';
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
import { habitApi, HabitCategory } from '@atlas/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: HabitCategory | null;
}

export function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; name: string }) =>
      habitApi.updateCategory(variables.id, { name: variables.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-categories'] });
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      toast.success('Category updated successfully!');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;
    updateMutation.mutate({ id: category.id, name: name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-background border-brand-border rounded-none shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-medium tracking-tight">
            Edit Habit Category
          </DialogTitle>
          <DialogDescription className="text-xs text-brand-muted font-mono">
            Update category title and properties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-[10px] font-mono uppercase tracking-wider text-brand-muted">
                Category Name
              </FieldLabel>
              <Input
                placeholder="e.g. Health, Mindfulness"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-9 font-sans text-xs rounded-none border-brand-border"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-3 border-t border-brand-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-brand-border text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending || !name.trim()}
              className="bg-brand-charcoal text-brand-canvas rounded-none font-mono text-xs"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
