import React from 'react';
import { Button } from '@atlas/ui/components/button';
import { Plus, ArrowsLeftRight, Coins, Shield, UploadSimple } from '@phosphor-icons/react';

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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[#EAEAEA] bg-white p-3.5 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[#787774]">
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
          variant="outline"
          size="sm"
          className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] bg-white text-xs font-medium text-[#346538] hover:bg-[#EDF3EC]"
        >
          <Coins className="size-3.5" />
          <span>Assign Money</span>
        </Button>

        <Button
          onClick={onAddGoal}
          variant="outline"
          size="sm"
          className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] bg-white text-xs font-medium text-[#1F6C9F] hover:bg-[#E1F3FE]"
        >
          <Shield className="size-3.5" />
          <span>Create Goal</span>
        </Button>

        <Button
          onClick={onImportCsv}
          variant="outline"
          size="sm"
          className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] bg-white text-xs font-medium text-[#111111] hover:bg-[#F7F6F3]"
        >
          <UploadSimple className="size-3.5" />
          <span>Import CSV</span>
        </Button>
      </div>
    </div>
  );
}
