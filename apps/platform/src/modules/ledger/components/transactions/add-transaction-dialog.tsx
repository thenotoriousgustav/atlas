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

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
    date: string;
    accountId: string;
    categoryId?: string;
    payee?: string;
    memo?: string;
  }) => void;
  transactionToEdit?: any | null;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; categoryGroup?: { name: string } }>;
}

export function AddTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  accounts = [],
  categories = [],
}: AddTransactionDialogProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [payee, setPayee] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title || '');
      setAmount(formatNumberWithDots(transactionToEdit.amount ?? ''));
      setType(transactionToEdit.type || 'EXPENSE');
      setDate(transactionToEdit.date ? new Date(transactionToEdit.date) : new Date());
      setAccountId(transactionToEdit.accountId || '');
      setCategoryId(transactionToEdit.categoryId || '');
      setPayee(transactionToEdit.payee || '');
      setMemo(transactionToEdit.memo || '');
    } else {
      setTitle('');
      setAmount('');
      setType('EXPENSE');
      setDate(new Date());
      setAccountId(accounts[0]?.id || '');
      setCategoryId('');
      setPayee('');
      setMemo('');
    }
  }, [transactionToEdit, isOpen, accounts]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithDots(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseDotsToNumber(amount);
    if (!title.trim() || numericAmount <= 0 || !accountId || !date) return;

    onSubmit({
      title: title.trim(),
      amount: numericAmount,
      type,
      date: date.toISOString(),
      accountId,
      categoryId: categoryId || undefined,
      payee: payee.trim() || undefined,
      memo: memo.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">
              Transaction Title / Description
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Grocery, Salary, Internet Bill"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Transaction Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#EAEAEA]">
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Amount (IDR)</Label>
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
                  onChange={handleAmountChange}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#EAEAEA]">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#EAEAEA]">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryGroup?.name ? `${cat.categoryGroup.name} → ` : ''}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Date</Label>
              <DatePicker date={date} setDate={setDate} placeholder="Select transaction date" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">Payee / Merchant</Label>
              <Input
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g. Tokopedia, Starbucks"
                className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">Memo / Notes</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Optional transaction memo"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
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
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
