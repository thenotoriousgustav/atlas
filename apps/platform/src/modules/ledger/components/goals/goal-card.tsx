import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Shield, Target, CalendarBlank, PencilSimple, Trash, CheckCircle } from '@phosphor-icons/react';

export interface GoalItem {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface GoalCardProps {
  goal: GoalItem;
  onEdit: (goal: GoalItem) => void;
  onDelete: (id: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const percentage = Math.min(
    100,
    Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100)
  );

  const remaining = Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0));

  const monthsToComplete =
    goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : 0;

  return (
    <Card className="flex flex-col justify-between rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs transition-all hover:border-[#CCCCCC]">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-[#EAEAEA] bg-[#F7F6F3]">
              <Shield className="size-4 text-[#1F6C9F]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-sans text-xs font-semibold text-[#111111]">
                  {goal.name}
                </h4>
                {percentage >= 100 && (
                  <span className="flex items-center gap-1 rounded-none bg-[#EDF3EC] px-1.5 py-0.2 text-[9px] font-semibold text-[#346538]">
                    <CheckCircle className="size-3" />
                    <span>Tercapai</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#787774]">
                {goal.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal)}
              className="size-7 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
            >
              <PencilSimple className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal.id)}
              className="size-7 rounded-none text-[#9F2F2D] hover:bg-[#FDEBEC]"
            >
              <Trash className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar & Percent */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="font-mono text-sm font-bold text-[#111111]">
              {formatCurrency(goal.currentAmount || 0)}
            </span>
            <span className="font-mono text-xs text-[#787774]">
              dari {formatCurrency(goal.targetAmount || 0)} ({percentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-none bg-[#F7F6F3]">
            <div
              className="h-full bg-[#111111] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer / Contribution info */}
      <div className="mt-4 border-t border-[#EAEAEA] pt-3 text-[11px] text-[#787774]">
        <div className="flex items-center justify-between">
          <span>Target Bulanan:</span>
          <span className="font-mono font-medium text-[#111111]">
            {formatCurrency(goal.monthlyContribution || 0)}/bln
          </span>
        </div>
        {monthsToComplete > 0 && percentage < 100 && (
          <div className="mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CalendarBlank className="size-3 text-[#787774]" />
              <span>Estimasi ETA:</span>
            </span>
            <span className="font-mono font-medium text-[#111111]">
              ~{monthsToComplete} Bulan lagi
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
