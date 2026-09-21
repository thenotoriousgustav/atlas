"use client";

import React from 'react';
import { QueueTask } from '@atlas/api-client';
import { Badge } from '@atlas/ui/components/badge';
import { cn } from '@/lib/utils';
import {
  Square,
  CheckSquare,
  Calendar,
  Clock,
  FolderSimple,
  Tag,
  CheckCircle,
  Trash,
  DotsThreeVertical,
  Flag,
} from '@phosphor-icons/react';

interface TaskItemProps {
  task: QueueTask;
  onToggle: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

export function TaskItem({
  task,
  onToggle,
  onSelect,
  onDelete,
  className,
}: TaskItemProps) {
  const isCompleted = task.status === 'DONE';

  const completedSubtasksCount = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;

  const formatDue = (dateStr?: string | null, timeStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const isOverdue = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let label = isToday
      ? 'Today'
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (timeStr) {
      label += ` · ${timeStr}`;
    }

    return { label, isOverdue, isToday };
  };

  const dueInfo = formatDue(task.dueDate, task.dueTime);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1':
        return {
          label: 'P1 Urgent',
          className:
            'bg-[#FDEBEC] text-[#9F2F2D] border-[#FDEBEC] dark:bg-[#9F2F2D]/20 dark:text-[#FDEBEC]',
        };
      case 'P2':
        return {
          label: 'P2 High',
          className:
            'bg-[#FBF3DB] text-[#956400] border-[#FBF3DB] dark:bg-[#956400]/20 dark:text-[#FBF3DB]',
        };
      case 'P3':
        return {
          label: 'P3 Normal',
          className:
            'bg-[#E1F3FE] text-[#1F6C9F] border-[#E1F3FE] dark:bg-[#1F6C9F]/20 dark:text-[#E1F3FE]',
        };
      case 'P4':
        return {
          label: 'P4 Low',
          className:
            'bg-[#EDF3EC] text-[#346538] border-[#EDF3EC] dark:bg-[#346538]/20 dark:text-[#EDF3EC]',
        };
      default:
        return null;
    }
  };

  const priorityBadge = getPriorityBadge(task.priority);

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={cn(
        'group relative flex cursor-pointer items-start justify-between gap-3 border border-brand-border bg-white p-3.5 transition-all duration-150 hover:border-brand-charcoal hover:shadow-xs dark:bg-card select-none',
        isCompleted && 'opacity-60 bg-brand-canvas/60',
        className
      )}
    >
      {/* Left: Checkbox + Content */}
      <div className="flex flex-1 items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-brand-muted transition-colors hover:text-brand-charcoal focus:outline-none"
        >
          {isCompleted ? (
            <CheckSquare className="size-4 text-brand-charcoal" weight="fill" />
          ) : (
            <Square className="size-4 hover:text-brand-charcoal" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <h4
              className={cn(
                'font-sans text-xs font-medium text-brand-charcoal tracking-tight break-words',
                isCompleted && 'line-through text-brand-muted font-normal'
              )}
            >
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="font-sans text-[11px] text-brand-muted line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Meta Chips: Due Date, Project, Subtasks, Labels, Priority */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            {/* Priority Chip */}
            {priorityBadge && (
              <Badge
                variant="outline"
                className={cn(
                  'rounded-none px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                  priorityBadge.className
                )}
              >
                {priorityBadge.label}
              </Badge>
            )}

            {/* Due Date Chip */}
            {dueInfo && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px]',
                  !isCompleted && dueInfo.isOverdue
                    ? 'text-[#9F2F2D] font-semibold'
                    : 'text-brand-muted'
                )}
              >
                <Calendar className="size-3" />
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Project Chip */}
            {task.project && (
              <span className="flex items-center gap-1 text-brand-muted border-l border-brand-border/80 pl-1.5">
                <FolderSimple className="size-3" />
                <span>{task.project.name}</span>
              </span>
            )}

            {/* Subtask Progress Chip */}
            {totalSubtasksCount > 0 && (
              <span className="flex items-center gap-1 text-brand-muted border-l border-brand-border/80 pl-1.5">
                <CheckCircle className="size-3" />
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount}
                </span>
              </span>
            )}

            {/* Labels Chips */}
            {task.labels?.map((lbl) => (
              <span
                key={lbl.id || lbl.name}
                className="flex items-center gap-0.5 text-[9px] text-brand-muted bg-brand-charcoal/5 px-1 py-0.5"
              >
                <Tag className="size-2.5" />
                <span>#{lbl.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Hover Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
          className="flex size-6 items-center justify-center text-brand-muted hover:text-[#9F2F2D] focus:outline-none"
        >
          <Trash className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
