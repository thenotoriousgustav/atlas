import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import { Label } from '@atlas/ui/components/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';
import { DatePicker } from '../shared/date-picker';

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
  }) => void;
  goalToEdit?: any | null;
}

export function AddGoalDialog({
  isOpen,
  onClose,
  onSubmit,
  goalToEdit,
}: AddGoalDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name || '');
      setTargetAmount(formatNumberWithDots(goalToEdit.targetAmount ?? ''));
      setCurrentAmount(formatNumberWithDots(goalToEdit.currentAmount ?? '0'));
      setTargetDate(goalToEdit.targetDate ? new Date(goalToEdit.targetDate) : undefined);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate(undefined);
    }
  }, [goalToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseDotsToNumber(targetAmount);
    if (!name.trim() || numTarget <= 0) return;

    onSubmit({
      name: name.trim(),
      targetAmount: numTarget,
      currentAmount: parseDotsToNumber(currentAmount),
      targetDate: targetDate ? targetDate.toISOString() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {goalToEdit ? 'Edit Financial Goal' : 'Add New Financial Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, House Down Payment"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Target Amount (IDR)</Label>
              <InputGroup className="h-9 rounded-none border-[#EAEAEA]">
                <InputGroupAddon>
                  <InputGroupText className="font-mono text-xs font-semibold text-[#111111]">
                    Rp
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="font-mono text-xs text-[#111111]"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText className="font-mono text-[10px] text-[#787774]">
                    IDR
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Current Balance (IDR)</Label>
              <InputGroup className="h-9 rounded-none border-[#EAEAEA]">
                <InputGroupAddon>
                  <InputGroupText className="font-mono text-xs font-semibold text-[#111111]">
                    Rp
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="numeric"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="font-mono text-xs text-[#111111]"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText className="font-mono text-[10px] text-[#787774]">
                    IDR
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Target Completion Date</Label>
            <DatePicker
              date={targetDate}
              setDate={setTargetDate}
              placeholder="Pick target completion date"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-none border-[#EAEAEA] text-xs text-[#787774] hover:bg-[#F7F6F3]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              Save Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
