import React from 'react';
import { Button } from '@atlas/ui/components/button';
import { Plus, Coins, Shield, UploadSimple } from '@phosphor-icons/react';

interface QuickActionsProps {
  onAddTransaction: () => void;
  onAssignMoney: () => void;
  onAddGoal: () => void;
  onImportCsv: () => void;
}

export function QuickActions({
  onAddTransaction,
  onAssignMoney,
  onAddGoal,
  onImportCsv,
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]">
          Quick Actions:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onAddTransaction}
          size="sm"
          className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
        >
          <Plus className="size-3.5" />
          <span>Add Transaction</span>
        </Button>

        <Button
          onClick={onAssignMoney}
          size="sm"
          className="h-8.5 gap-1.5 rounded-none bg-[#346538] text-xs font-medium text-white hover:bg-[#28502c]"
        >
          <Coins className="size-3.5" />
          <span>Assign Money</span>
        </Button>

        <Button
          onClick={onAddGoal}
          variant="outline"
          size="sm"
          className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
        >
          <Shield className="size-3.5" />
          <span>Create Goal</span>
        </Button>

        <Button
          onClick={onImportCsv}
          variant="outline"
          size="sm"
          className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
        >
          <UploadSimple className="size-3.5" />
          <span>Import CSV</span>
        </Button>
      </div>
    </div>
  );
}
