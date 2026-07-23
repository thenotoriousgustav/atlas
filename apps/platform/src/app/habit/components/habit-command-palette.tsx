'use client';

import React from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@atlas/ui/components/command';
import { HabitTracker } from '@atlas/api-client';
import { Plus, CheckCircle, Flame, CalendarCheck, SlidersHorizontal, House } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface HabitCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackers: HabitTracker[];
  onSelectHabitCheckin: (habitId: string) => void;
  onOpenCreateDialog: () => void;
  onFilterCategory?: (category: string) => void;
}

export function HabitCommandPalette({
  open,
  onOpenChange,
  trackers,
  onSelectHabitCheckin,
  onOpenCreateDialog,
  onFilterCategory,
}: HabitCommandPaletteProps) {
  const router = useRouter();

  const handleRunCommand = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Atlas Habit Command Palette"
      description="Type a command or search habit trackers..."
    >
      <CommandInput placeholder="Type a habit command or search trackers... (e.g. Read, Workout, Check-in)" />

      <CommandList className="max-h-80">
        <CommandEmpty className="text-xs font-mono text-muted-foreground">
          No habits or commands found.
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => handleRunCommand(() => onOpenCreateDialog())}
            className="cursor-pointer gap-2 font-medium"
          >
            <Plus className="size-4 text-emerald-500 font-bold" />
            <span>Create New Habit Tracker</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleRunCommand(() => router.push('/'))}
            className="cursor-pointer gap-2 font-medium"
          >
            <House className="size-4 text-sky-500" />
            <span>Return to Atlas Home Portal</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Active Habit Trackers Quick Check-in */}
        {trackers.length > 0 && (
          <CommandGroup heading="Habit Trackers Check-in">
            {trackers.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => handleRunCommand(() => onSelectHabitCheckin(t.id))}
                className="cursor-pointer justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CalendarCheck className={`size-4 ${t.isCompletedToday ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span className="font-semibold text-xs">{t.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({t.category} • {t.type})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {t.isCompletedToday && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Done Today
                    </span>
                  )}
                  <CommandShortcut>Log &gt;</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Categories */}
        <CommandGroup heading="Filter Categories">
          {['ALL', 'Health', 'Learning', 'Productivity', 'Lifestyle', 'Finance'].map((cat) => (
            <CommandItem
              key={cat}
              onSelect={() =>
                handleRunCommand(() => {
                  if (onFilterCategory) onFilterCategory(cat);
                })
              }
              className="cursor-pointer gap-2"
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span>Show {cat} Habits</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
