import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import {
  CreditCard,
  Bank,
  Wallet,
  Coins,
  PencilSimple,
  Trash,
  CheckCircle,
} from '@phosphor-icons/react';

export interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isOnBudget?: boolean;
}

interface AccountCardProps {
  account: AccountItem;
  onEdit: (account: AccountItem) => void;
  onDelete: (id: string) => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: account.currency || 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CHECKING':
      case 'SAVINGS':
        return <Bank className="size-4 text-[#1F6C9F]" />;
      case 'CREDIT_CARD':
        return <CreditCard className="size-4 text-[#9F2F2D]" />;
      case 'CASH':
        return <Coins className="size-4 text-[#346538]" />;
      default:
        return <Wallet className="size-4 text-[#956400]" />;
    }
  };

  return (
    <Card className="flex flex-col justify-between rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs transition-all hover:border-[#CCCCCC]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-none border border-[#EAEAEA] bg-[#F7F6F3]">
            {getAccountIcon(account.type)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-sans text-xs font-semibold text-[#111111]">
                {account.name}
              </h4>
              {account.isOnBudget && (
                <span className="rounded-none bg-[#EDF3EC] px-1.5 py-0.2 text-[9px] font-semibold text-[#346538]">
                  On-Budget
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#787774]">
              {account.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(account)}
            className="size-7 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
          >
            <PencilSimple className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(account.id)}
            className="size-7 rounded-none text-[#9F2F2D] hover:bg-[#FDEBEC]"
          >
            <Trash className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-[#EAEAEA] pt-3">
        <span className="text-[10px] text-[#787774]">Current Balance</span>
        <div className="font-mono text-lg font-bold tracking-tight text-[#111111]">
          {formatCurrency(account.balance)}
        </div>
      </div>
    </Card>
  );
}
