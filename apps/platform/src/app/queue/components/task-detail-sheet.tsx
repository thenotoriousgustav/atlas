"use client";

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@atlas/ui/components/sheet';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { QueueProject, QueueTask } from '@atlas/api-client';
import {
  Calendar,
  Clock,
  FolderSimple,
  Trash,
  CheckSquare,
  Square,
  Plus,
  Flag,
  Tag,
  Repeat,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface TaskDetailSheetProps {
  task: QueueTask | null;
  isOpen: boolean;
  projects: QueueProject[];
  onClose: () => void;
  onUpdateTask: (
    taskId: string,
    data: {
      title?: string;
      description?: string;
      projectId?: string | null;
      priority?: string;
      dueDate?: string | null;
      dueTime?: string | null;
      recurrenceRule?: string | null;
    }
  ) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (subtaskId: string) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
}

export function TaskDetailSheet({
  task,
  isOpen,
  projects,
  onClose,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>('NONE');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [recurrenceRule, setRecurrenceRule] = useState<string>('NONE');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.projectId || null);
      setPriority(task.priority || 'NONE');
      setDueDate(task.dueDate ? (task.dueDate.split('T')[0] ?? '') : '');
      setDueTime(task.dueTime || '');
      setRecurrenceRule(task.recurrenceRule || 'NONE');
    }
  }, [task]);

  if (!task) return null;

  const handleSaveField = async (fields: {
    title?: string;
    description?: string;
    projectId?: string | null;
    priority?: string;
    dueDate?: string | null;
    dueTime?: string | null;
    recurrenceRule?: string | null;
  }) => {
    setIsSaving(true);
    try {
      await onUpdateTask(task.id, fields);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const isCompleted = task.status === 'DONE';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-brand-border bg-white p-6 dark:bg-card overflow-y-auto space-y-6"
      >
        <SheetHeader className="space-y-2 border-b border-brand-border pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="flex items-center gap-2 font-mono text-xs text-brand-charcoal hover:underline focus:outline-none"
            >
              {isCompleted ? (
                <CheckSquare className="size-4 text-brand-charcoal" weight="fill" />
              ) : (
                <Square className="size-4 text-brand-muted" />
              )}
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="text-brand-muted hover:text-[#9F2F2D] text-xs font-mono flex items-center gap-1 uppercase tracking-tight"
            >
              <Trash className="size-3.5" />
              <span className="text-[10px]">Delete</span>
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== task.title) {
                handleSaveField({ title: title.trim() });
              }
            }}
            placeholder="Task Title"
            className="w-full bg-transparent font-serif text-xl font-medium tracking-tight text-brand-charcoal focus:outline-none border-b border-transparent focus:border-brand-border"
          />
        </SheetHeader>

        {/* Metadata Controls: Project, Due Date, Priority */}
        <div className="space-y-4 font-mono text-xs">
          {/* Project Selector */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-brand-muted text-[11px] uppercase tracking-wider">
              <FolderSimple className="size-3.5" />
              <span>Project</span>
            </span>
            <select
              value={projectId || ''}
              onChange={(e) => {
                const val = e.target.value ? e.target.value : null;
                setProjectId(val);
                handleSaveField({ projectId: val });
              }}
              className="bg-transparent border border-brand-border px-2 py-1 text-xs text-brand-charcoal focus:outline-none rounded-none"
            >
              <option value="">Inbox (No Project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-brand-muted text-[11px] uppercase tracking-wider">
              <Flag className="size-3.5" />
              <span>Priority</span>
            </span>
            <select
              value={priority}
              onChange={(e) => {
                const val = e.target.value;
                setPriority(val);
                handleSaveField({ priority: val });
              }}
              className="bg-transparent border border-brand-border px-2 py-1 text-xs text-brand-charcoal focus:outline-none rounded-none"
            >
              <option value="NONE">None</option>
              <option value="P1">P1 - Urgent</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Normal</option>
              <option value="P4">P4 - Low</option>
            </select>
          </div>

          {/* Due Date & Time */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-brand-muted text-[11px] uppercase tracking-wider">
              <Calendar className="size-3.5" />
              <span>Due Date</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ dueDate: e.target.value || null });
                }}
                className="bg-transparent border border-brand-border px-2 py-1 text-xs text-brand-charcoal focus:outline-none rounded-none"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => {
                  setDueTime(e.target.value);
                  handleSaveField({ dueTime: e.target.value || null });
                }}
                className="bg-transparent border border-brand-border px-2 py-1 text-xs text-brand-charcoal focus:outline-none rounded-none"
              />
            </div>
          </div>

          {/* Recurrence Rule */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-brand-muted text-[11px] uppercase tracking-wider">
              <Repeat className="size-3.5" />
              <span>Recurrence</span>
            </span>
            <select
              value={recurrenceRule}
              onChange={(e) => {
                const val = e.target.value;
                setRecurrenceRule(val);
                handleSaveField({ recurrenceRule: val === 'NONE' ? null : val });
              }}
              className="bg-transparent border border-brand-border px-2 py-1 text-xs text-brand-charcoal focus:outline-none rounded-none"
            >
              <option value="NONE">No repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        {/* Subtasks Checklist */}
        <div className="space-y-3 border-t border-brand-border pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
              Subtasks ({task.subtasks?.filter((s) => s.completed).length || 0}/
              {task.subtasks?.length || 0})
            </h4>
          </div>

          <div className="space-y-1.5">
            {task.subtasks?.map((sub) => (
              <div
                key={sub.id}
                className="group flex items-center justify-between gap-2 border border-brand-border/60 bg-brand-canvas/50 px-2.5 py-1.5 text-xs font-sans"
              >
                <button
                  type="button"
                  onClick={() => onToggleSubtask(sub.id)}
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                  {sub.completed ? (
                    <CheckSquare className="size-3.5 text-brand-charcoal" weight="fill" />
                  ) : (
                    <Square className="size-3.5 text-brand-muted" />
                  )}
                  <span
                    className={cn(
                      'truncate text-brand-charcoal',
                      sub.completed && 'line-through text-brand-muted'
                    )}
                  >
                    {sub.title}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(sub.id)}
                  className="opacity-0 group-hover:opacity-100 text-brand-muted hover:text-[#9F2F2D] p-1"
                >
                  <Trash className="size-3" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 bg-transparent border border-brand-border px-2.5 py-1 font-sans text-xs text-brand-charcoal focus:outline-none placeholder:text-brand-muted/70 rounded-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newSubtaskTitle.trim()}
              className="h-7 rounded-none bg-brand-charcoal px-2 font-mono text-[10px] uppercase text-white hover:bg-brand-charcoal/90"
            >
              Add
            </Button>
          </form>
        </div>

        {/* Notes & Description */}
        <div className="space-y-2 border-t border-brand-border pt-4">
          <h4 className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
            Description / Notes
          </h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description || '')) {
                handleSaveField({ description });
              }
            }}
            placeholder="Add detailed markdown notes, links, or instructions..."
            rows={5}
            className="w-full bg-transparent border border-brand-border p-2.5 font-sans text-xs text-brand-charcoal placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-charcoal rounded-none"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
