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

interface AddSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  subscriptionToEdit?: any | null;
  isPending?: boolean;
}

export function AddSubscriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  subscriptionToEdit,
  isPending = false,
}: AddSubscriptionDialogProps) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [category, setCategory] = useState('ENTERTAINMENT');

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name || '');
      setCost(subscriptionToEdit.cost?.toString() || '');
      setBillingCycle(subscriptionToEdit.billingCycle || 'MONTHLY');
      setStartDate(
        subscriptionToEdit.startDate
          ? (subscriptionToEdit.startDate.split('T')[0] || '')
          : (new Date().toISOString().split('T')[0] || '')
      );
      setCategory(subscriptionToEdit.category || 'ENTERTAINMENT');
    } else {
      setName('');
      setCost('');
      setBillingCycle('MONTHLY');
      setStartDate(new Date().toISOString().split('T')[0] || '');
      setCategory('ENTERTAINMENT');
    }
  }, [subscriptionToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;

    onSubmit({
      name: name.trim(),
      cost: parseFloat(cost) || 0,
      billingCycle,
      startDate,
      category,
      status: 'ACTIVE',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            {subscriptionToEdit ? 'Edit Subskripsi' : 'Tambah Subskripsi Rutin'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Pantau pengeluaran berlangganan berulang bulanan atau tahunan Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Nama Subskripsi</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix Premium, Spotify Family, ChatGPT Plus"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Biaya Tagihan (IDR)</label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#111111]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Siklus Penagihan</label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectGroup>
                    <SelectItem value="MONTHLY">Bulanan (Monthly)</SelectItem>
                    <SelectItem value="YEARLY">Tahunan (Yearly)</SelectItem>
                    <SelectItem value="WEEKLY">Mingguan (Weekly)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Tanggal Mulai / Tagihan</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Kategori</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ENTERTAINMENT, SOFTWARE"
                className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
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
              {isPending ? 'Menyimpan...' : subscriptionToEdit ? 'Simpan Perubahan' : 'Tambah Subskripsi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
