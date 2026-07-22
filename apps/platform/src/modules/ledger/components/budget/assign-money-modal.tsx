import React, { useState } from 'react';
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

interface AssignMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyToAssign: number;
  categories: Array<{ id: string; name: string }>;
  onAssignSubmit: (categoryId: string, amount: number) => void;
}

export function AssignMoneyModal({
  isOpen,
  onClose,
  readyToAssign,
  categories = [],
  onAssignSubmit,
}: AssignMoneyModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseDotsToNumber(amount);
    if (!selectedCategoryId || val <= 0) return;

    onAssignSubmit(selectedCategoryId, val);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            Assign Money
          </DialogTitle>
          <p className="text-xs text-[#787774]">
            Select a target category to assign your available cash (Ready to Assign).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-none border border-[#346538]/20 bg-[#EDF3EC] p-3 text-[#346538]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#346538]">
              Cash Available to Assign
            </span>
            <div className="font-mono text-base font-bold">
              {formatCurrency(readyToAssign)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Select Target Category</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Amount to Assign (IDR)</Label>
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
              disabled={!selectedCategoryId || !amount}
              className="h-9 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              Assign Funds
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
