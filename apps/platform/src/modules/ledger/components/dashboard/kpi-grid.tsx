import React from 'react';
import { Card } from '@atlas/ui/components/card';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Hourglass,
  Vault,
} from '@phosphor-icons/react';

interface KpiGridProps {
  totalNetWorth: number;
  totalCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  readyToAssign: number;
  budgetRemaining: number;
}

export function KpiGrid({
  totalNetWorth,
  totalCash,
  monthlyIncome,
  monthlyExpenses,
  readyToAssign,
  budgetRemaining,
}: KpiGridProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const savingsRate =
    monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100))
      : 0;

  const ageOfMoney =
    monthlyExpenses > 0 ? Math.round((totalCash / (monthlyExpenses / 30))) : 0;

  const kpis = [
    {
      label: 'Net Worth',
      value: formatCurrency(totalNetWorth),
      icon: <Vault className="size-4 text-[#111111]" />,
      badge: 'Total Kekayaan',
      bgBadge: 'bg-[#F7F6F3] text-[#111111]',
    },
    {
      label: 'Cash Available',
      value: formatCurrency(totalCash),
      icon: <Wallet className="size-4 text-[#1F6C9F]" />,
      badge: 'Kas Aktif',
      bgBadge: 'bg-[#E1F3FE] text-[#1F6C9F]',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(monthlyIncome),
      icon: <ArrowDownLeft className="size-4 text-[#346538]" />,
      badge: 'Pemasukan',
      bgBadge: 'bg-[#EDF3EC] text-[#346538]',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(monthlyExpenses),
      icon: <ArrowUpRight className="size-4 text-[#9F2F2D]" />,
      badge: 'Pengeluaran',
      bgBadge: 'bg-[#FDEBEC] text-[#9F2F2D]',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      icon: <PiggyBank className="size-4 text-[#346538]" />,
      badge: 'Rasio Tabungan',
      bgBadge: 'bg-[#EDF3EC] text-[#346538]',
    },
    {
      label: 'Age of Money',
      value: `${ageOfMoney} Hari`,
      icon: <Hourglass className="size-4 text-[#956400]" />,
      badge: 'Rule 4 YNAB',
      bgBadge: 'bg-[#FBF3DB] text-[#956400]',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi, idx) => (
        <Card
          key={idx}
          className="flex flex-col justify-between rounded-none border border-[#EAEAEA] bg-white p-3.5 shadow-2xs transition-all hover:border-[#CCCCCC]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#787774]">{kpi.label}</span>
            <div className="flex size-7 items-center justify-center rounded-none border border-[#EAEAEA] bg-[#F7F6F3]">
              {kpi.icon}
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-base font-bold tracking-tight text-[#111111]">
              {kpi.value}
            </span>
            <div className="mt-1.5 flex items-center">
              <span className={`rounded-none px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${kpi.bgBadge}`}>
                {kpi.badge}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
