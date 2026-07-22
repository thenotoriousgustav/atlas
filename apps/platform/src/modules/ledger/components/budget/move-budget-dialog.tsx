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
import { ArrowsLeftRight } from '@phosphor-icons/react';

interface MoveBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  initialSourceId?: string;
  onMoveBudgetSubmit: (fromCategoryId: string, toCategoryId: string, amount: number) => Promise<void>;
}

export function MoveBudgetDialog({
  isOpen,
  onClose,
  categories = [],
  initialSourceId,
  onMoveBudgetSubmit,
}: MoveBudgetDialogProps) {
  const [fromCategoryId, setFromCategoryId] = useState('');
  const [toCategoryId, setToCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSourceId) {
      setToCategoryId(initialSourceId);
    }
  }, [initialSourceId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCategoryId || !toCategoryId || !amount || fromCategoryId === toCategoryId) return;

    setIsSubmitting(true);
    try {
      await onMoveBudgetSubmit(fromCategoryId, toCategoryId, parseFloat(amount) || 0);
      onClose();
      setAmount('');
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
            Move Budget (Rule 3 YNAB)
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Roll With The Punches: Pindahkan alokasi dana dari kategori yang masih longgar untuk menutupi overspending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Pindahkan Dari Kategori (Sumber)</label>
            <Select value={fromCategoryId} onValueChange={setFromCategoryId}>
              <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Pilih Kategori Sumber" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} (Available: Rp{(cat.available || 0).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center py-1 text-[#787774]">
            <ArrowsLeftRight className="size-5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Ke Kategori (Tujuan Overspending)</label>
            <Select value={toCategoryId} onValueChange={setToCategoryId}>
              <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Pilih Kategori Tujuan" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} (Available: Rp{(cat.available || 0).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Jumlah Nominal (IDR)</label>
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
              {isSubmitting ? 'Memindahkan...' : 'Pindahkan Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
