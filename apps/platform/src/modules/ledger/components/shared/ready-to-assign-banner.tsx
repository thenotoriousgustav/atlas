import React from 'react';
import { Button } from '@atlas/ui/components/button';
import { Coins, ArrowRight, WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface ReadyToAssignBannerProps {
  readyToAssign: number;
  onOpenAssignModal: () => void;
}

export function ReadyToAssignBanner({
  readyToAssign,
  onOpenAssignModal,
}: ReadyToAssignBannerProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  if (readyToAssign > 0) {
    return (
      <div className="flex flex-col items-center justify-between gap-4 rounded-none border border-[#346538]/20 bg-[#EDF3EC] p-4 text-[#346538] shadow-2xs sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-none bg-[#346538] text-white">
            <Coins className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight">
                {formatCurrency(readyToAssign)}
              </span>
              <span className="rounded-none bg-[#346538]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Ready to Assign
              </span>
            </div>
            <p className="text-xs text-[#346538]/90">
              Give every rupiah a job before spending (Rule 1: Zero-Based Allocation).
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenAssignModal}
          className="h-9 gap-2 rounded-none bg-[#346538] text-xs font-medium text-white hover:bg-[#28502c]"
        >
          <span>Assign Money Now</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    );
  }

  if (readyToAssign < 0) {
    return (
      <div className="flex flex-col items-center justify-between gap-4 rounded-none border border-[#9F2F2D]/20 bg-[#FDEBEC] p-4 text-[#9F2F2D] shadow-2xs sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-none bg-[#9F2F2D] text-white">
            <WarningCircle className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight">
                {formatCurrency(readyToAssign)}
              </span>
              <span className="rounded-none bg-[#9F2F2D]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Over-Assigned
              </span>
            </div>
            <p className="text-xs text-[#9F2F2D]/90">
              Total allocated budget exceeds available cash. Reduce category assignments.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenAssignModal}
          variant="outline"
          className="h-9 rounded-none border-[#9F2F2D]/30 bg-white text-xs font-medium text-[#9F2F2D] hover:bg-[#FDEBEC]"
        >
          <span>Adjust Budget</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-none border border-[#EAEAEA] bg-white p-3.5 text-[#111111] shadow-2xs">
      <div className="flex items-center gap-3">
        <CheckCircle className="size-5 text-[#346538]" />
        <div>
          <span className="font-mono text-xs font-semibold text-[#111111]">
            Ready to Assign = Rp0
          </span>
          <p className="text-[11px] text-[#787774]">
            All available cash has been fully assigned to your categories.
          </p>
        </div>
      </div>
      <Button
        onClick={onOpenAssignModal}
        variant="outline"
        size="sm"
        className="h-8 rounded-none border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
      >
        Manage Allocation
      </Button>
    </div>
  );
}
