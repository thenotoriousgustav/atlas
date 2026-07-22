import React from 'react';
import { Button } from '@atlas/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@atlas/ui/components/table';
import { Plus, PencilSimple, Trash, Clock } from '@phosphor-icons/react';

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  nextBillingDate: string;
  category?: string;
  isActive: boolean;
}

interface SubscriptionListProps {
  subscriptions: SubscriptionItem[];
  onAddSubscription: () => void;
  onEditSubscription: (subscription: SubscriptionItem) => void;
  onDeleteSubscription: (id: string) => void;
}

export function SubscriptionList({
  subscriptions = [],
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
}: SubscriptionListProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex flex-col gap-4">
      {/* Subscription Table */}
      <div className="rounded-none border border-[#EAEAEA] bg-white shadow-2xs overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F7F6F3]">
            <TableRow className="border-[#EAEAEA]">
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Subscription Name
              </TableHead>
              <TableHead className="w-32 text-right font-mono text-[11px] font-semibold text-[#787774]">
                Cost
              </TableHead>
              <TableHead className="w-28 font-mono text-[11px] font-semibold text-[#787774]">
                Cycle
              </TableHead>
              <TableHead className="w-36 font-mono text-[11px] font-semibold text-[#787774]">
                Next Renewal
              </TableHead>
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Category
              </TableHead>
              <TableHead className="w-24 font-mono text-[11px] font-semibold text-[#787774]">
                Status
              </TableHead>
              <TableHead className="w-20 text-right font-mono text-[11px] font-semibold text-[#787774]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <TableRow key={sub.id} className="border-[#EAEAEA] hover:bg-[#F7F6F3]/50">
                  <TableCell className="font-medium text-xs text-[#111111]">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-[#787774]" />
                      <span>{sub.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-[#111111]">
                    {formatCurrency(sub.amount)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#787774]">
                    {sub.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#787774]">
                    {new Date(sub.nextBillingDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-xs text-[#787774]">
                    {sub.category || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-none px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                        sub.isActive
                          ? 'bg-[#EDF3EC] text-[#346538]'
                          : 'bg-[#F7F6F3] text-[#787774]'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Paused'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditSubscription(sub)}
                        className="size-7 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
                      >
                        <PencilSimple className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSubscription(sub.id)}
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
                  No active subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
