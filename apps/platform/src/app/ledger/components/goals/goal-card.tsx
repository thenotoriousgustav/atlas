import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Shield, PencilSimple, Trash, CheckCircle } from '@phosphor-icons/react';

export interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
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

  const isCompleted = percentage >= 100;

  return (
    <Card className="flex flex-col justify-between rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs transition-all hover:border-[#CCCCCC]">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 items-center justify-center rounded-none border ${
                isCompleted
                  ? 'border-[#346538]/30 bg-[#EDF3EC] text-[#346538]'
                  : 'border-[#EAEAEA] bg-[#F7F6F3] text-[#111111]'
              }`}
            >
              {isCompleted ? <CheckCircle className="size-4" /> : <Shield className="size-4" />}
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#111111]">{goal.name}</h4>
              {goal.targetDate && (
                <p className="text-[10px] font-mono text-[#787774]">
                  Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              )}
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
              className="size-7 rounded-none text-[#787774] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
            >
              <Trash className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#787774]">Progress</span>
            <span className="font-bold text-[#111111]">{percentage}%</span>
          </div>

          {/* Custom Sharp Progress Bar */}
          <div className="h-2 w-full rounded-none bg-[#F7F6F3] overflow-hidden border border-[#EAEAEA]">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-[#346538]' : 'bg-[#111111]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 font-mono text-xs">
            <span className="font-bold text-[#111111]">{formatCurrency(goal.currentAmount || 0)}</span>
            <span className="text-[#787774]">of {formatCurrency(goal.targetAmount || 0)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
