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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@atlas/ui/components/select';
import { Checkbox } from '@atlas/ui/components/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    isOnBudget: boolean;
  }) => void;
  accountToEdit?: any | null;
}

export function AddAccountDialog({
  isOpen,
  onClose,
  onSubmit,
  accountToEdit,
}: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('0');
  const [isOnBudget, setIsOnBudget] = useState(true);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setType(accountToEdit.type || 'BANK');
      setBalance(formatNumberWithDots(accountToEdit.balance ?? '0'));
      setIsOnBudget(accountToEdit.isOnBudget ?? true);
    } else {
      setName('');
      setType('BANK');
      setBalance('0');
      setIsOnBudget(true);
    }
  }, [accountToEdit, isOpen]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBalance(formatNumberWithDots(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      balance: parseDotsToNumber(balance),
      isOnBudget,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {accountToEdit ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Account Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bank Mandiri, GoPay, BCA"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Account Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                <SelectItem value="BANK">Bank Account</SelectItem>
                <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="INVESTMENT">Investment</SelectItem>
              </SelectContent>
            </Select>
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
                value={balance}
                onChange={handleBalanceChange}
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

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isOnBudget"
              checked={isOnBudget}
              onCheckedChange={(checked) => setIsOnBudget(!!checked)}
              className="rounded-none border-[#CCCCCC] data-[state=checked]:bg-[#111111]"
            />
            <Label htmlFor="isOnBudget" className="text-xs text-[#111111]">
              Include in Budget (On-Budget)
            </Label>
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
              Save Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
