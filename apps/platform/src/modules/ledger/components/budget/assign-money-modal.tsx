import React, { useState } from 'react';
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
import { Coins } from '@phosphor-icons/react';

interface AssignMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyToAssign: number;
  categories: any[];
  onAssignSubmit: (categoryId: string, amount: number) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !amount) return;

    setIsSubmitting(true);
    try {
      await onAssignSubmit(selectedCategoryId, parseFloat(amount) || 0);
      onClose();
      setAmount('');
      setSelectedCategoryId('');
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Assign Money (Rule 1 YNAB)
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Alokasikan dana mengendap dari Ready to Assign ke kategori pengeluaran pilihan Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-none border border-[#346538]/20 bg-[#EDF3EC] p-3 text-[#346538]">
            <div className="flex items-center gap-2">
              <Coins className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Ready to Assign:</span>
            </div>
            <span className="font-mono text-base font-bold">
              {formatCurrency(readyToAssign)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Pilih Kategori Tujuan</label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.categoryGroup?.name || 'Group'})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Jumlah Alokasi (IDR)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
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
              disabled={isSubmitting}
              className="h-8.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              {isSubmitting ? 'Mengalokasikan...' : 'Alokasikan Dana'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
