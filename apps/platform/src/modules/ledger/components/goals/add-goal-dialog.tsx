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
import { GoalItem } from './goal-card';

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  goalToEdit?: GoalItem | null;
  isPending?: boolean;
}

export function AddGoalDialog({
  isOpen,
  onClose,
  onSubmit,
  goalToEdit,
  isPending = false,
}: AddGoalDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('EMERGENCY_FUND');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name || '');
      setType(goalToEdit.type || 'EMERGENCY_FUND');
      setTargetAmount(goalToEdit.targetAmount?.toString() || '');
      setCurrentAmount(goalToEdit.currentAmount?.toString() || '');
      setMonthlyContribution(goalToEdit.monthlyContribution?.toString() || '');
      setTargetDate(goalToEdit.targetDate ? (goalToEdit.targetDate.split('T')[0] || '') : '');
    } else {
      setName('');
      setType('EMERGENCY_FUND');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyContribution('');
      setTargetDate('');
    }
  }, [goalToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    onSubmit({
      name: name.trim(),
      type,
      targetAmount: parseFloat(targetAmount) || 0,
      currentAmount: parseFloat(currentAmount) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            {goalToEdit ? 'Edit Financial Goal' : 'Tambah Financial Goal Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Tetapkan target tabungan jangka panjang untuk mewujudkan impian finansial Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Nama Goal</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dana Darurat 6 Bulan, DP Rumah, Liburan Japan"
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#111111]">Kategori Goal</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="Pilih Jenis Goal" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  <SelectItem value="EMERGENCY_FUND">Dana Darurat (Emergency Fund)</SelectItem>
                  <SelectItem value="SAVINGS">Tabungan Biasa</SelectItem>
                  <SelectItem value="VACATION">Liburan (Vacation)</SelectItem>
                  <SelectItem value="HOUSE">Pembelian Rumah / Property</SelectItem>
                  <SelectItem value="CAR">Pembelian Kendaraan</SelectItem>
                  <SelectItem value="WEDDING">Pernikahan</SelectItem>
                  <SelectItem value="RETIREMENT">Dana Pensiun</SelectItem>
                  <SelectItem value="DEBT_PAYOFF">Pelunasan Hutang</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Target Total (IDR)</label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#111111]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Saldo Terkumpul Saat Ini</label>
              <Input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Target Bulanan (IDR)</label>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="0"
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Target Tanggal (ETA)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 rounded-none border-[#EAEAEA] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
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
              {isPending ? 'Menyimpan...' : goalToEdit ? 'Simpan Perubahan' : 'Buat Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
