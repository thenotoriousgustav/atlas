import React from 'react';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@atlas/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@atlas/ui/components/table';
import {
  MagnifyingGlass,
  PencilSimple,
  Trash,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowsLeftRight,
} from '@phosphor-icons/react';

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  date: string;
  accountId: string;
  account?: { name: string };
  categoryId?: string;
  category?: { name: string };
  payee?: string;
  memo?: string;
}

interface TransactionTableProps {
  transactions: TransactionItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';
  setTypeFilter: (filter: 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: TransactionItem) => void;
  onDeleteTransaction: (id: string) => void;
  onImportCsv: () => void;
}

export function TransactionTable({
  transactions = [],
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionTableProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Type Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[#EAEAEA] bg-white p-3.5 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#787774]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions by title or payee..."
              className="h-9 rounded-none border-[#EAEAEA] pl-9 text-xs focus-visible:ring-[#111111]"
            />
          </div>

          <div className="w-44">
            <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
              <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#EAEAEA]">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="EXPENSE">Expenses</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="TRANSFER">Transfers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transaction Data Table */}
      <div className="rounded-none border border-[#EAEAEA] bg-white shadow-2xs overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F7F6F3]">
            <TableRow className="border-[#EAEAEA]">
              <TableHead className="w-32 font-mono text-[11px] font-semibold text-[#787774]">
                Date
              </TableHead>
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Description
              </TableHead>
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Category
              </TableHead>
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Account
              </TableHead>
              <TableHead className="w-28 font-mono text-[11px] font-semibold text-[#787774]">
                Type
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                Amount
              </TableHead>
              <TableHead className="w-20 text-right font-mono text-[11px] font-semibold text-[#787774]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="border-[#EAEAEA] hover:bg-[#F7F6F3]/50">
                  <TableCell className="font-mono text-xs text-[#787774]">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-[#111111]">
                    {tx.title}
                    {tx.memo && (
                      <span className="block text-[10px] text-[#787774]">{tx.memo}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#787774]">
                    {tx.category?.name || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-[#787774]">
                    {tx.account?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-none px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                        tx.type === 'INCOME'
                          ? 'bg-[#EDF3EC] text-[#346538]'
                          : tx.type === 'EXPENSE'
                          ? 'bg-[#FDEBEC] text-[#9F2F2D]'
                          : 'bg-[#E1F3FE] text-[#1F6C9F]'
                      }`}
                    >
                      {tx.type === 'INCOME' && <ArrowDownLeft className="size-3" />}
                      {tx.type === 'EXPENSE' && <ArrowUpRight className="size-3" />}
                      {tx.type === 'TRANSFER' && <ArrowsLeftRight className="size-3" />}
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-[#111111]">
                    {tx.type === 'EXPENSE' ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                        className="size-7 rounded-none text-[#787774] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-[#787774]">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
