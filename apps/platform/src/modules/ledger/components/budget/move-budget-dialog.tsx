import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Label } from '@atlas/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@atlas/ui/components/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

interface MoveBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; assigned?: number }>;
  initialSourceId?: string;
  onMoveBudgetSubmit: (fromId: string, toId: string, amount: number) => void;
}

export function MoveBudgetDialog({
  isOpen,
  onClose,
  categories = [],
  initialSourceId,
  onMoveBudgetSubmit,
}: MoveBudgetDialogProps) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (initialSourceId) {
      setFromId(initialSourceId);
    } else if (categories.length > 0 && !fromId) {
      setFromId(categories[0]?.id || '');
    }
  }, [initialSourceId, categories, isOpen, fromId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseDotsToNumber(amount);
    if (!fromId || !toId || val <= 0 || fromId === toId) return;

    onMoveBudgetSubmit(fromId, toId, val);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            Move Budget (Rule 3)
          </DialogTitle>
          <p className="text-xs text-[#787774]">
            Move money from a category with extra funds to a category that needs it (Roll With The Punches).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">From Category (Source)</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Select Source Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} (Assigned: Rp{(c.assigned || 0).toLocaleString('id-ID')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">To Category (Destination)</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Select Destination Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                {categories
                  .filter((c) => c.id !== fromId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} (Assigned: Rp{(c.assigned || 0).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Amount to Move (IDR)</Label>
            <InputGroup className="h-9 rounded-none border-[#EAEAEA]">
              <InputGroupAddon>
                <InputGroupText className="font-mono text-xs font-semibold text-[#111111]">
                  Rp
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatNumberWithDots(e.target.value))}
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
              disabled={!fromId || !toId || fromId === toId || !amount}
              className="h-9 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              Move Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
