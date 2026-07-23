'use client';

import React, { useState } from 'react';
import { Button } from '@atlas/ui/components/button';
import {
  Plus,
  Lightning,
  FolderSimple,
  CalendarCheck,
  Gear,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { HabitDashboardSummary, habitApi, HabitCategory } from '@atlas/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryManagementModal } from './category-management-modal';
import { EditCategoryDialog } from './edit-category-dialog';
import { useConfirm } from '@atlas/ui/hooks/use-confirm';
import { toast } from 'sonner';

interface HabitSidebarFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenCreate: () => void;
  dashboardData?: HabitDashboardSummary;
}

export function HabitSidebarFilters({
  selectedCategory,
  onSelectCategory,
  onOpenCreate,
  dashboardData,
}: HabitSidebarFiltersProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HabitCategory | null>(null);

  // Fetch dynamic user categories via TanStack Query
  const { data: userCategories = [] } = useQuery<HabitCategory[]>({
    queryKey: ['habit-categories'],
    queryFn: () => habitApi.getCategories(),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => habitApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-categories'] });
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] });
      toast.success('Category deleted!');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleDeleteCategory = async (cat: HabitCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: `Delete category "${cat.name}"?`,
      description: 'This will remove the category filter. Habit trackers using this category will remain intact.',
      actionLabel: 'Delete Category',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (isConfirmed) {
      deleteCategoryMutation.mutate(cat.id);
    }
  };

  const handleEditCategory = (cat: HabitCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
  };

  return (
    <aside className="space-y-6">
      {/* Primary Action Button */}
      <div className="space-y-2">
        <Button
          onClick={onOpenCreate}
          className="w-full justify-center gap-2 bg-brand-charcoal text-brand-canvas hover:bg-brand-charcoal/90 rounded-none font-mono text-xs font-semibold uppercase tracking-wider h-9"
        >
          <Plus className="size-4" /> New Custom Tracker
        </Button>
      </div>

      {/* Navigation / Overview Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Overview
        </h3>
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left font-sans ${
            selectedCategory === 'ALL'
              ? 'bg-brand-charcoal/10 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <CalendarCheck className="size-3.5" />
            All Trackers
          </span>
          {dashboardData && (
            <span className="font-mono text-[10px] text-brand-muted">
              {dashboardData.totalTrackers}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Categories Group with Hover Action Icons & Alert Dialog */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
            Categories
          </h3>
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="text-[10px] font-mono text-brand-muted hover:text-brand-charcoal flex items-center gap-0.5"
            title="Manage Categories"
          >
            <Gear className="size-3" /> Manage
          </button>
        </div>

        {userCategories.map((cat) => {
          const count = (dashboardData?.trackers || []).filter(
            (t) => t.category.toUpperCase() === cat.name.toUpperCase()
          ).length;
          const isActive = selectedCategory.toUpperCase() === cat.name.toUpperCase();

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left font-sans cursor-pointer ${
                isActive
                  ? 'bg-brand-charcoal/10 text-brand-charcoal font-semibold'
                  : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderSimple className="size-3.5 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Hover Action Icons (Cabinet Style) */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleEditCategory(cat, e)}
                    className="text-brand-muted hover:text-brand-charcoal p-0.5"
                    title="Edit category"
                  >
                    <PencilSimple className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(cat, e)}
                    className="text-brand-muted hover:text-destructive p-0.5"
                    title="Delete category"
                  >
                    <Trash className="size-3" />
                  </button>
                </div>

                <span className="font-mono text-[10px] text-brand-muted ml-1">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Progress Widget */}
      <div className="pt-4 border-t border-brand-border space-y-3">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2 flex items-center gap-1">
          <Lightning className="size-3.5 text-amber-500" /> Today Summary
        </h3>

        <div className="p-3 border border-brand-border bg-white dark:bg-card space-y-2 font-mono text-xs rounded-none">
          <div className="flex items-center justify-between text-brand-muted">
            <span>Completed</span>
            <span className="font-bold text-brand-charcoal">
              {dashboardData?.completedTodayCount || 0} / {dashboardData?.totalTrackers || 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-brand-muted">
            <span>Progress Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {dashboardData ? `${Math.round(dashboardData.todayProgressRate)}%` : '0%'}
            </span>
          </div>

          <div className="h-1.5 w-full bg-brand-canvas border border-brand-border overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${dashboardData?.todayProgressRate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        open={isManageCategoriesOpen}
        onOpenChange={setIsManageCategoriesOpen}
        categories={userCategories}
      />
    </aside>
  );
}
