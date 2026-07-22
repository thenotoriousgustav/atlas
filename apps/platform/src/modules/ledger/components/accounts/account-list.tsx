import React from 'react';
import { AccountCard, AccountItem } from './account-card';
import { Button } from '@atlas/ui/components/button';
import { Plus, CreditCard } from '@phosphor-icons/react';

interface AccountListProps {
  accounts: AccountItem[];
  onAddAccount: () => void;
  onEditAccount: (account: AccountItem) => void;
  onDeleteAccount: (id: string) => void;
}

export function AccountList({
  accounts = [],
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: AccountListProps) {
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#787774]">
            Total Saldo Rekening
          </span>
          <div className="font-mono text-xl font-bold tracking-tight text-[#111111]">
            {formatCurrency(totalBalance)}
          </div>
        </div>
        <Button
          onClick={onAddAccount}
          size="sm"
          className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
        >
          <Plus className="size-3.5" />
          <span>Tambah Account Baru</span>
        </Button>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={onEditAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <CreditCard className="size-8 text-[#787774]" />
          <p className="mt-2 text-xs font-medium text-[#111111]">Belum ada account yang ditambahkan</p>
          <p className="text-[11px] text-[#787774]">
            Tambahkan rekening bank, e-wallet, atau kas untuk mulai mengelola keuangan.
          </p>
          <Button
            onClick={onAddAccount}
            size="sm"
            className="mt-4 h-8 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white"
          >
            <Plus className="size-3.5" />
            <span>Tambah Account</span>
          </Button>
        </div>
      )}
    </div>
  );
}
