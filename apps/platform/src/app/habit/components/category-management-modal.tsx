'use client';

import React, { useState } from 'react';
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
import { Plus, Trash, PencilSimple, FolderSimple } from '@phosphor-icons/react';

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: HabitCategory[];
}

export function CategoryManagementModal({
  open,
  onOpenChange,
  categories,
}: CategoryManagementModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState<HabitCategory | null>(null);

  const createMutation = useMutation({
    mutationFn: (catName: string) => habitApi.createCategory({ name: catName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-categories'] });
      toast.success('Category created successfully!');
      setName('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; name: string }) =>
      habitApi.updateCategory(variables.id, { name: variables.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-categories'] });
      toast.success('Category updated!');
      setEditingCategory(null);
      setName('');
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-categories'] });
      toast.success('Category deleted!');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: name.trim() });
    } else {
      createMutation.mutate(name.trim());
    }
  };

  const handleStartEdit = (cat: HabitCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background border-brand-border rounded-none shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-medium tracking-tight">
            Manage Habit Categories
          </DialogTitle>
          <DialogDescription className="text-xs text-brand-muted font-mono">
            Create, edit, or remove custom categories for your habit trackers.
          </DialogDescription>
        </DialogHeader>

        {/* Create / Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-[10px] font-mono uppercase tracking-wider text-brand-muted">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Category Name'}
              </FieldLabel>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g. Mindfulness, Languages, Hobbies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 font-sans text-xs rounded-none border-brand-border"
                />
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}
                  className="h-9 px-3 bg-brand-charcoal text-brand-canvas rounded-none font-mono text-xs"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </Button>
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-9 px-2 rounded-none border-brand-border text-xs"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Field>
          </FieldGroup>
        </form>

        {/* Category List */}
        <div className="space-y-2 pt-3 border-t border-brand-border max-h-60 overflow-y-auto pr-1">
          <span className="text-[10px] font-mono uppercase text-brand-muted tracking-wider block">
            Existing Categories ({categories.length})
          </span>

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 border border-brand-border bg-white dark:bg-card text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <FolderSimple className="size-3.5 text-brand-charcoal" />
                <span>{cat.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-none text-brand-muted hover:text-brand-charcoal"
                  onClick={() => handleStartEdit(cat)}
                >
                  <PencilSimple className="size-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-none text-brand-muted hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3 border-t border-brand-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-brand-border text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
