import React from 'react';
import { GoalCard, GoalItem } from './goal-card';
import { Button } from '@atlas/ui/components/button';
import { Plus, Shield } from '@phosphor-icons/react';

interface GoalGridProps {
  goals: GoalItem[];
  onAddGoal: () => void;
  onEditGoal: (goal: GoalItem) => void;
  onDeleteGoal: (id: string) => void;
}

export function GoalGrid({
  goals = [],
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
}: GoalGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <Shield className="size-8 text-[#787774]" />
          <p className="mt-2 text-xs font-medium text-[#111111]">No financial goals added yet</p>
          <p className="text-[11px] text-[#787774]">
            Create savings goals like Emergency Funds, House Down Payment, or Vacation Funds.
          </p>
          <Button
            onClick={onAddGoal}
            size="sm"
            className="mt-4 h-8 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
          >
            <Plus className="size-3.5" />
            <span>Add Goal</span>
          </Button>
        </div>
      )}
    </div>
  );
}
