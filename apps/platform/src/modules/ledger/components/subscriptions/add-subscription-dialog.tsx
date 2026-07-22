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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';
import { DatePicker } from '../shared/date-picker';

interface AddSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    nextBillingDate: string;
    category?: string;
    isActive: boolean;
  }) => void;
  subscriptionToEdit?: any | null;
}

export function AddSubscriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  subscriptionToEdit,
}: AddSubscriptionDialogProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [nextBillingDate, setNextBillingDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name || '');
      setAmount(formatNumberWithDots(subscriptionToEdit.amount ?? ''));
      setBillingCycle(subscriptionToEdit.billingCycle || 'MONTHLY');
      setNextBillingDate(
        subscriptionToEdit.nextBillingDate
          ? new Date(subscriptionToEdit.nextBillingDate)
          : new Date()
      );
      setCategory(subscriptionToEdit.category || '');
      setIsActive(subscriptionToEdit.isActive ?? true);
    } else {
      setName('');
      setAmount('');
      setBillingCycle('MONTHLY');
      setNextBillingDate(new Date());
      setCategory('');
      setIsActive(true);
    }
  }, [subscriptionToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseDotsToNumber(amount);
    if (!name.trim() || numAmount <= 0 || !nextBillingDate) return;

    onSubmit({
      name: name.trim(),
      amount: numAmount,
      billingCycle,
      nextBillingDate: nextBillingDate.toISOString(),
      category: category.trim() || undefined,
      isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {subscriptionToEdit ? 'Edit Subscription' : 'Add New Subscription'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">
              Service / Subscription Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Spotify, ChatGPT Plus, iCloud"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Cost (IDR)</Label>
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Billing Cycle</Label>
              <Select
                value={billingCycle}
                onValueChange={(val: any) => setBillingCycle(val)}
              >
                <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue placeholder="Cycle" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#EAEAEA]">
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Next Renewal Date</Label>
              <DatePicker
                date={nextBillingDate}
                setDate={setNextBillingDate}
                placeholder="Select renewal date"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Entertainment, Software"
                className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Status</Label>
            <Select
              value={isActive ? 'ACTIVE' : 'PAUSED'}
              onValueChange={(val) => setIsActive(val === 'ACTIVE')}
            >
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
              </SelectContent>
            </Select>
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
              Save Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
