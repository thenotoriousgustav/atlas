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
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex flex-col gap-4">
      {/* Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Total Financial Goals Progress
          </span>
          <div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-[#111111]">
            <span>{formatCurrency(totalSaved)}</span>
            <span className="text-xs font-normal text-[#787774]">
              dari {formatCurrency(totalTarget)}
            </span>
          </div>
        </div>
        <Button
          onClick={onAddGoal}
          size="sm"
          className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
        >
          <Plus className="size-3.5" />
          <span>Tambah Goal Baru</span>
        </Button>
      </div>

      {/* Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onEdit={onEditGoal} onDelete={onDeleteGoal} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <Shield className="size-8 text-[#787774]" />
          <p className="mt-2 text-xs font-medium text-[#111111]">Belum ada Financial Goal</p>
          <p className="text-[11px] text-[#787774]">
            Buat target tabungan seperti Dana Darurat, Liburan, atau Rumah impian Anda.
          </p>
          <Button
            onClick={onAddGoal}
            size="sm"
            className="mt-4 h-8 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white"
          >
            <Plus className="size-3.5" />
            <span>Buat Goal Pertama</span>
          </Button>
        </div>
      )}
    </div>
  );
}
