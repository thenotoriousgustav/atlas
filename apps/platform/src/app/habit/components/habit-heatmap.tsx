'use client';

import React from 'react';
import {
  ContributionGraph,
  ContributionGraphCalendar,
  ContributionGraphBlock,
  ContributionGraphFooter,
  ContributionGraphTotalCount,
  ContributionGraphLegend,
  Activity,
} from '@atlas/ui/components/kibo-ui/contribution-graph';
import { eachDayOfInterval, endOfYear, formatISO, startOfYear, parseISO, format } from 'date-fns';
import { cn } from '@atlas/ui/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@atlas/ui/components/tooltip';

interface HabitHeatmapProps {
  data?: Activity[];
  goalDirection?: 'INCREASING' | 'DECREASING';
  title?: string;
  className?: string;
}

export function HabitHeatmap({ data = [], goalDirection = 'INCREASING', title, className }: HabitHeatmapProps) {
  // Generate full year days (from startOfYear to endOfYear) so the GitHub graph is always full & visible
  const fullYearData = React.useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: startOfYear(now),
      end: endOfYear(now),
    });

    const userActivityMap = new Map<string, Activity>(
      (data || []).map((item) => [item.date, item])
    );

    return days.map((dateObj) => {
      const dateStr = formatISO(dateObj, { representation: 'date' });
      if (userActivityMap.has(dateStr)) {
        return userActivityMap.get(dateStr)!;
      }
      return {
        date: dateStr,
        count: 0,
        level: 0,
      };
    });
  }, [data]);

  // Color classes mapping for INCREASING vs DECREASING goals
  const getLevelColorClass = (level: number) => {
    if (goalDirection === 'DECREASING') {
      switch (level) {
        case 1:
          return 'data-[level="1"]:fill-[#9be9a8] dark:data-[level="1"]:fill-[#0e4429]';
        case 2:
          return 'data-[level="2"]:fill-amber-400 dark:data-[level="2"]:fill-amber-600';
        case 3:
          return 'data-[level="3"]:fill-amber-600 dark:data-[level="3"]:fill-amber-700';
        case 4:
          return 'data-[level="4"]:fill-rose-600 dark:data-[level="4"]:fill-rose-500';
        default:
          return 'data-[level="0"]:fill-[#ebedf0] dark:data-[level="0"]:fill-[#161b22]';
      }
    }

    // Default GitHub Green palette for INCREASING goals
    switch (level) {
      case 1:
        return 'data-[level="1"]:fill-[#9be9a8] dark:data-[level="1"]:fill-[#0e4429]';
      case 2:
        return 'data-[level="2"]:fill-[#40c463] dark:data-[level="2"]:fill-[#006d32]';
      case 3:
        return 'data-[level="3"]:fill-[#30a14e] dark:data-[level="3"]:fill-[#26a641]';
      case 4:
        return 'data-[level="4"]:fill-[#216e39] dark:data-[level="4"]:fill-[#39d353]';
      default:
        return 'data-[level="0"]:fill-[#ebedf0] dark:data-[level="0"]:fill-[#161b22]';
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn('p-5 rounded-xl border border-border bg-card shadow-xs space-y-4 overflow-hidden', className)}>
      {title && (
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            {title}
          </h4>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
            Full Year Contribution
          </span>
        </div>
      )}

      <TooltipProvider>
        <ContributionGraph data={fullYearData} blockSize={12} blockMargin={3} blockRadius={2}>
          <ContributionGraphCalendar>
            {({ activity, dayIndex, weekIndex }) => (
              <Tooltip key={`${activity.date}-${dayIndex}`}>
                <TooltipTrigger asChild>
                  <g>
                    <ContributionGraphBlock
                      activity={activity}
                      dayIndex={dayIndex}
                      weekIndex={weekIndex}
                      className={cn(
                        'cursor-pointer transition-all duration-150 outline-none',
                        getLevelColorClass(activity.level)
                      )}
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent className="text-xs font-mono py-1 px-2.5">
                  <p className="font-semibold">{formatDateLabel(activity.date)}</p>
                  <p className="text-muted-foreground">
                    {activity.count > 0 ? `${activity.count} contributions` : 'No contributions'}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </ContributionGraphCalendar>

          <ContributionGraphFooter className="mt-4 text-xs font-mono pt-2 border-t border-border/40 flex items-center justify-between">
            <ContributionGraphTotalCount />
            <ContributionGraphLegend />
          </ContributionGraphFooter>
        </ContributionGraph>
      </TooltipProvider>
    </div>
  );
}
