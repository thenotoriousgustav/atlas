"use client";

import React, { useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@atlas/ui/components/command';
import {
  CalendarCheck,
  Tray,
  CalendarBlank,
  Queue,
  CheckCircle,
  FolderSimple,
  Plus,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react';
import { QueueArea, QueueTask } from '@atlas/api-client';

interface QueueCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: QueueTask[];
  areas: QueueArea[];
  onSelectView: (view: 'inbox' | 'today' | 'upcoming' | 'all' | 'completed') => void;
  onSelectProject: (projectId: string) => void;
  onSelectTask: (taskId: string) => void;
  onQuickCreate: (input: string) => void;
  onOpenAiDecompose: () => void;
}

export function QueueCommandPalette({
  isOpen,
  onClose,
  tasks,
  areas,
  onSelectView,
  onSelectProject,
  onSelectTask,
  onQuickCreate,
  onOpenAiDecompose,
}: QueueCommandPaletteProps) {
  const [search, setSearch] = useState('');

  const allProjects = areas.flatMap((a) => a.projects || []);

  const handleSelect = (callback: () => void) => {
    callback();
    onClose();
    setSearch('');
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="border-b border-brand-border px-3 font-mono">
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command, search tasks, or capture task..."
          className="border-none text-xs text-brand-charcoal focus:ring-0 placeholder:text-brand-muted/70"
        />
      </div>

      <CommandList className="font-mono text-xs max-h-80 select-none">
        <CommandEmpty className="py-6 text-center text-xs text-brand-muted">
          {search.trim() ? (
            <div className="space-y-2">
              <p>No matching commands or tasks.</p>
              <button
                type="button"
                onClick={() => handleSelect(() => onQuickCreate(search))}
                className="inline-flex items-center gap-1.5 bg-brand-charcoal px-3 py-1.5 text-white uppercase text-[10px] font-semibold hover:bg-brand-charcoal/90"
              >
                <Plus className="size-3" />
                <span>Create task "{search}"</span>
              </button>
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          {search.trim() && (
            <CommandItem
              onSelect={() => handleSelect(() => onQuickCreate(search))}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-3.5 text-brand-charcoal" />
              <span>Create task: </span>
              <span className="font-semibold text-brand-charcoal truncate">"{search}"</span>
            </CommandItem>
          )}

          <CommandItem
            onSelect={() => handleSelect(onOpenAiDecompose)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Sparkle className="size-3.5 text-amber-500" />
            <span>AI Goal Decomposition...</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Views */}
        <CommandGroup heading="Views">
          <CommandItem
            onSelect={() => handleSelect(() => onSelectView('today'))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="size-3.5 text-brand-muted" />
            <span>View Today</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => onSelectView('inbox'))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Tray className="size-3.5 text-brand-muted" />
            <span>View Inbox</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => onSelectView('upcoming'))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CalendarBlank className="size-3.5 text-brand-muted" />
            <span>View Upcoming</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => onSelectView('completed'))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="size-3.5 text-brand-muted" />
            <span>View Completed</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => onSelectView('all'))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Queue className="size-3.5 text-brand-muted" />
            <span>View All Tasks</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Projects */}
        <CommandGroup heading="Projects">
          {allProjects.map((p) => (
            <CommandItem
              key={p.id}
              onSelect={() => handleSelect(() => onSelectProject(p.id))}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FolderSimple className="size-3.5 text-brand-muted" />
              <span>Open project: </span>
              <span className="font-semibold text-brand-charcoal">{p.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Active Tasks Jump */}
        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Active Tasks">
              {tasks.slice(0, 8).map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleSelect(() => onSelectTask(task.id))}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate flex-1">{task.title}</span>
                  {task.project && (
                    <span className="text-[10px] text-brand-muted shrink-0 ml-2">
                      {task.project.name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
