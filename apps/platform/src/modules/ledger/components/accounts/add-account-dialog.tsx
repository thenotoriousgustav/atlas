import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '@atlas/ui/components/select';
import { AccountItem } from './account-card';

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    currency: string;
    isOnBudget: boolean;
  }) => void;
  accountToEdit?: AccountItem | null;
  isPending?: boolean;
}

export function AddAccountDialog({
  isOpen,
  onClose,
  onSubmit,
  accountToEdit,
  isPending = false,
}: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('CHECKING');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [isOnBudget, setIsOnBudget] = useState(true);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setType(accountToEdit.type || 'CHECKING');
      setBalance(accountToEdit.balance?.toString() || '0');
      setCurrency(accountToEdit.currency || 'IDR');
      setIsOnBudget(accountToEdit.isOnBudget ?? true);
    } else {
      setName('');
      setType('CHECKING');
      setBalance('');
      setCurrency('IDR');
      setIsOnBudget(true);
    }
  }, [accountToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      currency,
      isOnBudget,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            {accountToEdit ? 'Edit Account' : 'Tambah Account Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Kelola rekening bank, e-wallet, kartu kredit, atau kas tunai Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Account Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BCA Checking, GoPay, Cash"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Account Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Pilih Jenis Account" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  <SelectItem value="CHECKING">Checking / Tabungan Utama</SelectItem>
                  <SelectItem value="SAVINGS">Savings / Deposito</SelectItem>
                  <SelectItem value="CASH">Cash / Kas Tunai</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card / Kartu Kredit</SelectItem>
                  <SelectItem value="E_WALLET">E-Wallet (GoPay, OVO, ShopeePay)</SelectItem>
                  <SelectItem value="INVESTMENT">Investment Account</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Saldo Awal</label>
              <Input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Mata Uang</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="IDR"
                className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-none border border-[#EAEAEA] bg-[#F7F6F3] p-2.5">
            <input
              type="checkbox"
              id="isOnBudget"
              checked={isOnBudget}
              onChange={(e) => setIsOnBudget(e.target.checked)}
              className="size-4 rounded-none border-[#EAEAEA] text-[#111111] accent-[#111111]"
            />
            <label htmlFor="isOnBudget" className="cursor-pointer text-xs font-medium text-[#111111]">
              Termasuk dalam Budget (On-Budget Account)
            </label>
          </div>

          <DialogFooter className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8.5 rounded-none border-[#EAEAEA] text-xs text-[#787774] hover:bg-[#F7F6F3]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-8.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              {isPending ? 'Menyimpan...' : accountToEdit ? 'Simpan Perubahan' : 'Tambah Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
