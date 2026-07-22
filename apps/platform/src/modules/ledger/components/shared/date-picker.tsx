'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from '@phosphor-icons/react';
import { Button } from '@atlas/ui/components/button';
import { Calendar } from '@atlas/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@atlas/ui/components/popover';
import { cn } from '@atlas/ui/lib/utils';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'Pick a date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatDate = (d: Date) => {
    try {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d.toISOString().split('T')[0];
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            'w-full h-9 justify-start text-left font-mono text-xs rounded-none border-[#EAEAEA] bg-white text-[#111111] hover:bg-[#F7F6F3]',
            !date && 'text-[#787774]',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-3.5 text-[#787774]" />
          {date ? formatDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none border-[#EAEAEA]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
