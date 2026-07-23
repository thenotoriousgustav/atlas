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
import {
  WorkspaceSidebar,
  WorkspaceSidebarAction,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
  WorkspaceSidebarWidget,
} from '@/components/workspace-sidebar';

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
    <WorkspaceSidebar>
      {/* Primary Action Button */}
      <WorkspaceSidebarAction>
        <Button
          onClick={onOpenCreate}
          className="w-full justify-center gap-2 bg-brand-charcoal text-brand-canvas hover:bg-brand-charcoal/90 rounded-none font-mono text-xs font-semibold uppercase tracking-wider h-9"
        >
          <Plus className="size-4" /> New Custom Tracker
        </Button>
      </WorkspaceSidebarAction>

      {/* Navigation / Overview Group */}
      <WorkspaceSidebarGroup title="Overview">
        <WorkspaceSidebarItem
          icon={<CalendarCheck className="size-3.5" />}
          label="All Trackers"
          badge={dashboardData?.totalTrackers}
          isActive={selectedCategory === 'ALL'}
          onClick={() => onSelectCategory('ALL')}
        />
      </WorkspaceSidebarGroup>

      {/* Dynamic Categories Group */}
      <WorkspaceSidebarGroup
        title="Categories"
        action={
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="text-[10px] font-mono text-brand-muted hover:text-brand-charcoal flex items-center gap-0.5"
            title="Manage Categories"
          >
            <Gear className="size-3" /> Manage
          </button>
        }
      >
        {userCategories.map((cat) => {
          const count = (dashboardData?.trackers || []).filter(
            (t) => t.category.toUpperCase() === cat.name.toUpperCase()
          ).length;
          const isActive = selectedCategory.toUpperCase() === cat.name.toUpperCase();

          return (
            <WorkspaceSidebarItem
              key={cat.id}
              icon={<FolderSimple className="size-3.5" />}
              label={cat.name}
              badge={count}
              isActive={isActive}
              onClick={() => onSelectCategory(cat.name)}
              hoverActions={
                <>
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
                </>
              }
            />
          );
        })}
      </WorkspaceSidebarGroup>

      {/* Daily Progress Widget */}
      <WorkspaceSidebarWidget
        title="Today Summary"
        icon={<Lightning className="size-3.5 text-amber-500" />}
      >
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
      </WorkspaceSidebarWidget>

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
    </WorkspaceSidebar>
  );
}
