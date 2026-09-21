"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { parseNaturalLanguageTask } from '../lib/nlp-parser';
import {
  Plus,
  Calendar,
  Clock,
  FolderSimple,
  Tag,
  Flag,
  Sparkle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { QueueProject } from '@atlas/api-client';

interface QuickCaptureInputProps {
  onAddTask: (taskData: {
    title: string;
    dueDate?: string;
    dueTime?: string;
    projectId?: string;
    priority?: string;
    labels?: string[];
  }) => Promise<void>;
  projects: QueueProject[];
  defaultProjectId?: string;
  onOpenAiDecompose?: () => void;
  className?: string;
}

export function QuickCaptureInput({
  onAddTask,
  projects,
  defaultProjectId,
  onOpenAiDecompose,
  className,
}: QuickCaptureInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const projectNames = useMemo(
    () => projects.map((p) => p.name),
    [projects]
  );

  const parsed = useMemo(() => {
    if (!value.trim()) return null;
    return parseNaturalLanguageTask(value, projectNames);
  }, [value, projectNames]);

  const matchedProject = useMemo(() => {
    if (parsed?.projectName) {
      const found = projects.find(
        (p) => p.name.toLowerCase() === parsed.projectName?.toLowerCase()
      );
      if (found) return found;
    }
    if (defaultProjectId) {
      return projects.find((p) => p.id === defaultProjectId);
    }
    return null;
  }, [parsed?.projectName, defaultProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const titleToSave = parsed?.cleanTitle || value.trim();
      await onAddTask({
        title: titleToSave,
        dueDate: parsed?.dueDate,
        dueTime: parsed?.dueTime,
        projectId: matchedProject?.id,
        priority: parsed?.priority || 'NONE',
        labels: parsed?.labels,
      });
      setValue('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'P1':
        return 'bg-[#FDEBEC] text-[#9F2F2D] border-[#FDEBEC] dark:bg-[#9F2F2D]/20 dark:text-[#FDEBEC]';
      case 'P2':
        return 'bg-[#FBF3DB] text-[#956400] border-[#FBF3DB] dark:bg-[#956400]/20 dark:text-[#FBF3DB]';
      case 'P3':
        return 'bg-[#E1F3FE] text-[#1F6C9F] border-[#E1F3FE] dark:bg-[#1F6C9F]/20 dark:text-[#E1F3FE]';
      case 'P4':
        return 'bg-[#EDF3EC] text-[#346538] border-[#EDF3EC] dark:bg-[#346538]/20 dark:text-[#EDF3EC]';
      default:
        return 'border-brand-border text-brand-muted';
    }
  };

  return (
    <div
      className={cn(
        'group transition-all duration-150 border bg-white p-3 dark:bg-card',
        isFocused
          ? 'border-brand-charcoal shadow-xs'
          : 'border-brand-border hover:border-brand-charcoal/40',
        className
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 shrink-0 items-center justify-center text-brand-muted">
            <Plus className="size-4 text-brand-charcoal" />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add task... (e.g. 'Besok jam 10 fix login bug @Inovasi #urgent')"
            className="flex-1 bg-transparent font-sans text-xs text-brand-charcoal placeholder:text-brand-muted/70 focus:outline-none"
          />

          {onOpenAiDecompose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAiDecompose}
              title="Decompose goal with AI"
              className="hidden sm:flex h-7 items-center gap-1.5 rounded-none border-brand-border px-2 font-mono text-[10px] tracking-tight uppercase hover:bg-brand-charcoal hover:text-white"
            >
              <Sparkle className="size-3 text-amber-500" />
              <span>AI Goal</span>
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!value.trim() || isSubmitting}
            className="h-7 rounded-none bg-brand-charcoal px-3 font-mono text-[10px] font-semibold text-white uppercase hover:bg-brand-charcoal/90 disabled:opacity-30"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </div>

        {/* Real-time NLP Interactive Parse Chips */}
        {parsed && (parsed.dueDate || parsed.dueTime || matchedProject || parsed.priority || parsed.labels.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-brand-border/60 pt-2 pl-8 font-mono text-[10px]">
            <span className="text-brand-muted uppercase tracking-wider text-[9px] mr-1">
              Parsed:
            </span>

            {parsed.dueLabel && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-none px-1.5 py-0.5 border-brand-border text-brand-charcoal"
              >
                <Calendar className="size-3 text-brand-muted" />
                <span>{parsed.dueLabel}</span>
              </Badge>
            )}

            {parsed.dueTime && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-none px-1.5 py-0.5 border-brand-border text-brand-charcoal"
              >
                <Clock className="size-3 text-brand-muted" />
                <span>{parsed.dueTime}</span>
              </Badge>
            )}

            {matchedProject && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-none px-1.5 py-0.5 border-brand-border text-brand-charcoal"
              >
                <FolderSimple className="size-3 text-brand-muted" />
                <span>{matchedProject.name}</span>
              </Badge>
            )}

            {parsed.priority && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 rounded-none px-1.5 py-0.5 font-semibold uppercase',
                  getPriorityBadgeClass(parsed.priority)
                )}
              >
                <Flag className="size-3" weight="fill" />
                <span>{parsed.priority}</span>
              </Badge>
            )}

            {parsed.labels.map((lbl) => (
              <Badge
                key={lbl}
                variant="outline"
                className="flex items-center gap-1 rounded-none px-1.5 py-0.5 border-brand-border text-brand-muted"
              >
                <Tag className="size-3" />
                <span>#{lbl}</span>
              </Badge>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
