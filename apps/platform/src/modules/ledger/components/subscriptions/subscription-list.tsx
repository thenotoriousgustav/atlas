import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Plus, Clock, PencilSimple, Trash } from '@phosphor-icons/react';

interface SubscriptionItem {
  id: string;
  name: string;
  cost: number;
  billingCycle: string;
  startDate: string;
  status: string;
  category?: string;
}

interface SubscriptionListProps {
  subscriptions: SubscriptionItem[];
  onAddSubscription: () => void;
  onEditSubscription: (sub: SubscriptionItem) => void;
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

  const monthlyTotal = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((acc, s) => {
      if (s.billingCycle === 'YEARLY') return acc + s.cost / 12;
      if (s.billingCycle === 'WEEKLY') return acc + s.cost * 4;
      return acc + s.cost;
    }, 0);

  const annualTotal = monthlyTotal * 12;

  return (
    <div className="flex flex-col gap-4">
      {/* Cost Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
              Total Estimasi Bulanan
            </span>
            <div className="font-mono text-xl font-bold tracking-tight text-[#111111]">
              {formatCurrency(monthlyTotal)}/bln
            </div>
          </div>
          <div className="border-l border-[#EAEAEA] pl-6">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
              Total Estimasi Tahunan
            </span>
            <div className="font-mono text-sm font-semibold text-[#787774]">
              {formatCurrency(annualTotal)}/thn
            </div>
          </div>
        </div>

        <Button
          onClick={onAddSubscription}
          size="sm"
          className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
        >
          <Plus className="size-3.5" />
          <span>Tambah Subskripsi Baru</span>
        </Button>
      </div>

      {/* Grid */}
      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <Card
              key={sub.id}
              className="flex flex-col justify-between rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs transition-all hover:border-[#CCCCCC]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-none border border-[#EAEAEA] bg-[#F7F6F3]">
                    <Clock className="size-4 text-[#956400]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-[#111111]">
                      {sub.name}
                    </h4>
                    <span className="rounded-none bg-[#F7F6F3] px-1.5 py-0.2 text-[9px] font-semibold uppercase text-[#787774]">
                      {sub.billingCycle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
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
                    className="size-7 rounded-none text-[#9F2F2D] hover:bg-[#FDEBEC]"
                  >
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 border-t border-[#EAEAEA] pt-3">
                <span className="text-[10px] text-[#787774]">Biaya Tagihan</span>
                <div className="font-mono text-lg font-bold tracking-tight text-[#111111]">
                  {formatCurrency(sub.cost)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <Clock className="size-8 text-[#787774]" />
          <p className="mt-2 text-xs font-medium text-[#111111]">Belum ada subskripsi rutin</p>
          <p className="text-[11px] text-[#787774]">
            Catat pengeluaran berlangganan seperti Netflix, Spotify, atau Cloud Hosting.
          </p>
          <Button
            onClick={onAddSubscription}
            size="sm"
            className="mt-4 h-8 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white"
          >
            <Plus className="size-3.5" />
            <span>Tambah Subskripsi</span>
          </Button>
        </div>
      )}
    </div>
  );
}
