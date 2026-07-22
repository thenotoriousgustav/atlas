import React from 'react';
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
import {
  Plus,
  MagnifyingGlass,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowsLeftRight,
  PencilSimple,
  Trash,
  UploadSimple,
  List,
} from '@phosphor-icons/react';

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  description?: string;
  account?: { name: string };
  categoryRel?: { name: string; categoryGroup?: { name: string } };
}

interface TransactionTableProps {
  transactions: TransactionItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: string;
  setTypeFilter: (t: any) => void;
  onAddTransaction: () => void;
  onEditTransaction: (tx: TransactionItem) => void;
  onDeleteTransaction: (id: string) => void;
  onImportCsv: () => void;
}

export function TransactionTable({
  transactions = [],
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onImportCsv,
}: TransactionTableProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[#EAEAEA] bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 size-3.5 text-[#787774]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="h-8.5 rounded-none border-[#EAEAEA] pl-8 text-xs focus-visible:ring-1 focus-visible:ring-[#111111]"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8.5 w-36 rounded-none border-[#EAEAEA] bg-white text-xs">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectGroup>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                <SelectItem value="INCOME">Pemasukan</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onImportCsv}
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
          >
            <UploadSimple className="size-3.5" />
            <span>Import CSV</span>
          </Button>
          <Button
            onClick={onAddTransaction}
            size="sm"
            className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
          >
            <Plus className="size-3.5" />
            <span>Catat Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-none border border-[#EAEAEA] bg-white shadow-2xs">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAEAEA] bg-[#F7F6F3] text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Transaksi</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-[#F9F9F8]">
                    <td className="whitespace-nowrap p-3 font-mono text-[11px] text-[#787774]">
                      {formatDate(tx.date)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex size-6.5 items-center justify-center rounded-none ${
                            tx.type === 'INCOME'
                              ? 'bg-[#EDF3EC] text-[#346538]'
                              : tx.type === 'EXPENSE'
                              ? 'bg-[#FDEBEC] text-[#9F2F2D]'
                              : 'bg-[#F7F6F3] text-[#111111]'
                          }`}
                        >
                          {tx.type === 'INCOME' ? (
                            <ArrowDownLeft className="size-3.5" />
                          ) : tx.type === 'EXPENSE' ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowsLeftRight className="size-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-sans font-semibold text-[#111111]">{tx.title}</div>
                          {tx.description && (
                            <div className="text-[10px] text-[#787774]">{tx.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-[#787774]">
                      {tx.account?.name || '-'}
                    </td>
                    <td className="p-3">
                      {tx.categoryRel ? (
                        <span className="rounded-none bg-[#F7F6F3] px-2 py-0.5 text-[10px] font-medium text-[#111111]">
                          {tx.categoryRel.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#787774]">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right font-mono font-bold tracking-tight">
                      <span
                        className={
                          tx.type === 'INCOME'
                            ? 'text-[#346538]'
                            : tx.type === 'EXPENSE'
                            ? 'text-[#111111]'
                            : 'text-[#1F6C9F]'
                        }
                      >
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTransaction(tx)}
                          className="size-7 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
                        >
                          <PencilSimple className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="size-7 rounded-none text-[#9F2F2D] hover:bg-[#FDEBEC]"
                        >
                          <Trash className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <List className="size-8 text-[#787774]" />
            <p className="mt-2 text-xs font-medium text-[#111111]">Tidak ada transaksi ditemukan</p>
            <p className="text-[11px] text-[#787774]">
              Mulai catat pengeluaran dan pemasukan Anda atau impor dari CSV.
            </p>
            <Button
              onClick={onAddTransaction}
              size="sm"
              className="mt-4 h-8 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white"
            >
              <Plus className="size-3.5" />
              <span>Catat Transaksi Pertama</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
