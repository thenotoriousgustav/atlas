"use client";

import React, { useMemo } from 'react';
import { QueueTask } from '@atlas/api-client';
import { TaskItem } from './task-item';
import { CheckCircle, Tray, CalendarBlank } from '@phosphor-icons/react';

interface TaskListProps {
  tasks: QueueTask[];
  viewTitle: string;
  onToggle: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({
  tasks,
  viewTitle,
  onToggle,
  onSelect,
  onDelete,
}: TaskListProps) {
  const { overdueTasks, pendingTasks, completedTasks } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdue: QueueTask[] = [];
    const pending: QueueTask[] = [];
    const completed: QueueTask[] = [];

    tasks.forEach((t) => {
      if (t.status === 'DONE') {
        completed.push(t);
      } else {
        if (t.dueDate && new Date(t.dueDate) < startOfToday) {
          overdue.push(t);
        } else {
          pending.push(t);
        }
      }
    });

    return {
      overdueTasks: overdue,
      pendingTasks: pending,
      completedTasks: completed,
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-brand-border bg-white/40 p-8 dark:bg-card/40 select-none">
        <div className="flex size-10 items-center justify-center bg-brand-charcoal/5 text-brand-charcoal mb-3">
          <CheckCircle className="size-5" />
        </div>
        <h3 className="font-serif text-lg font-medium text-brand-charcoal">
          Queue is clear
        </h3>
        <p className="mt-1 font-mono text-xs text-brand-muted max-w-sm">
          No tasks in {viewTitle}. Use the quick-add input above or press{' '}
          <kbd className="border border-brand-border bg-brand-canvas px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>{' '}
          to capture a new task.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#9F2F2D]/20">
            <h4 className="font-mono text-[10px] font-semibold tracking-wider text-[#9F2F2D] uppercase flex items-center gap-1.5">
              <span>Overdue</span>
              <span className="bg-[#FDEBEC] px-1 py-0.2 rounded-none text-[9px]">
                {overdueTasks.length}
              </span>
            </h4>
          </div>
          <div className="space-y-1.5">
            {overdueTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={onToggle}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Pending Section */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          {overdueTasks.length > 0 && (
            <div className="flex items-center justify-between pb-1 border-b border-brand-border">
              <h4 className="font-mono text-[10px] font-semibold tracking-wider text-brand-muted uppercase">
                {viewTitle} ({pendingTasks.length})
              </h4>
            </div>
          )}
          <div className="space-y-1.5">
            {pendingTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={onToggle}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-brand-border">
            <h4 className="font-mono text-[10px] font-semibold tracking-wider text-brand-muted uppercase">
              Completed ({completedTasks.length})
            </h4>
          </div>
          <div className="space-y-1.5">
            {completedTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={onToggle}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
