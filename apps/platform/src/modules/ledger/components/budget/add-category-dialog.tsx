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

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'createGroup' | 'editGroup' | 'createCategory' | 'editCategory';
  parentGroupId?: string | null;
  targetItem?: any | null;
  onSubmitGroup: (name: string, id?: string) => Promise<void>;
  onSubmitCategory: (
    name: string,
    groupId: string,
    targetAmount?: number,
    id?: string
  ) => Promise<void>;
}

export function AddCategoryDialog({
  isOpen,
  onClose,
  mode,
  parentGroupId,
  targetItem,
  onSubmitGroup,
  onSubmitCategory,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetItem) {
      setName(targetItem.name || '');
      setTargetAmount(targetItem.targetAmount?.toString() || '');
    } else {
      setName('');
      setTargetAmount('');
    }
  }, [targetItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'createGroup' || mode === 'editGroup') {
        await onSubmitGroup(name.trim(), targetItem?.id);
      } else if (mode === 'createCategory' || mode === 'editCategory') {
        const gId = parentGroupId || targetItem?.categoryGroupId;
        if (gId) {
          await onSubmitCategory(
            name.trim(),
            gId,
            parseFloat(targetAmount) || undefined,
            targetItem?.id
          );
        }
      }
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGroup = mode === 'createGroup' || mode === 'editGroup';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            {isGroup
              ? mode === 'createGroup'
                ? 'Tambah Category Group Baru'
                : 'Edit Category Group'
              : mode === 'createCategory'
              ? 'Tambah Kategori Anggaran'
              : 'Edit Kategori Anggaran'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            {isGroup
              ? 'Category Group mengelompokkan beberapa kategori (e.g. Kebutuhan Pokok, Lifestyle).'
              : 'Kategori anggaran digunakan untuk mengalokasikan target pengeluaran Anda.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">
              {isGroup ? 'Nama Group' : 'Nama Kategori'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isGroup ? 'e.g. Living Expenses, Savings' : 'e.g. Makanan & Groceries, Rent'}
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
            />
          </div>

          {!isGroup && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Target Bulanan Opsional (IDR)</label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
          )}

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
