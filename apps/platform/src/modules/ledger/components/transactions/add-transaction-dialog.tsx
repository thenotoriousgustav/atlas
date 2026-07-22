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

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  transactionToEdit?: any | null;
  accounts: any[];
  categories: any[];
  isPending?: boolean;
}

export function AddTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  accounts = [],
  categories = [],
  isPending = false,
}: AddTransactionDialogProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title || '');
      setAmount(transactionToEdit.amount?.toString() || '');
      setType(transactionToEdit.type || 'EXPENSE');
      setDate(transactionToEdit.date ? (transactionToEdit.date.split('T')[0] || '') : (new Date().toISOString().split('T')[0] || ''));
      setDescription(transactionToEdit.description || '');
      setAccountId(transactionToEdit.accountId || '');
      setCategoryId(transactionToEdit.categoryId || '');
    } else {
      setTitle('');
      setAmount('');
      setType('EXPENSE');
      setDate(new Date().toISOString().split('T')[0] || '');
      setDescription('');
      setAccountId(accounts[0]?.id || '');
      setCategoryId('');
    }
  }, [transactionToEdit, isOpen, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !accountId) return;

    onSubmit({
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      type,
      date,
      description: description.trim() || undefined,
      accountId,
      categoryId: categoryId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            {transactionToEdit ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Catat transaksi pengeluaran, pemasukan, atau transfer antar account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-1 rounded-none border border-[#EAEAEA] bg-[#F7F6F3] p-1">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-1.5 text-center text-xs font-semibold uppercase tracking-wider transition-all rounded-none ${
                  type === t
                    ? 'bg-[#111111] text-white shadow-2xs'
                    : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Judul Transaksi</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kopi Kuno, Gaji Bulanan, Belanja Supermarket"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Nominal (IDR)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#111111]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Tanggal</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Account</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-9 rounded-none border-[#EAEAEA] text-xs w-full">
                  <SelectValue placeholder="Pilih Account" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectGroup>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Kategori Budget</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-9 rounded-none border-[#EAEAEA] text-xs w-full">
                  <SelectValue placeholder="Tanpa Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectGroup>
                    <SelectItem value="">Tanpa Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.categoryGroup?.name || 'Group'})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Catatan Opsional</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tambahan..."
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
            />
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
              {isPending ? 'Menyimpan...' : transactionToEdit ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
