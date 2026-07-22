import React from 'react';
import { Card } from '@atlas/ui/components/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Vault, ChartBar, PiggyBank } from '@phosphor-icons/react';

interface IncomeExpenseReportProps {
  trends: Array<{ month: string; income: number; expense: number }>;
  totalIncome: number;
  totalExpense: number;
}

export function IncomeExpenseReport({
  trends = [],
  totalIncome = 0,
  totalExpense = 0,
}: IncomeExpenseReportProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const netSavings = totalIncome - totalExpense;
  const savingsRatio =
    totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Total Income (Periode)
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-[#346538]">
            {formatCurrency(totalIncome)}
          </div>
        </Card>

        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Total Expense (Periode)
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-[#9F2F2D]">
            {formatCurrency(totalExpense)}
          </div>
        </Card>

        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Net Savings & Ratio
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-xl font-bold text-[#111111]">
              {formatCurrency(netSavings)}
            </span>
            <span className="rounded-none bg-[#EDF3EC] px-2 py-0.5 font-mono text-xs font-bold text-[#346538]">
              {savingsRatio}%
            </span>
          </div>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="flex flex-col rounded-none border border-[#EAEAEA] bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-3">
          <ChartBar className="size-4 text-[#111111]" />
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#111111]">
            Laporan Arus Kas Historis
          </h3>
        </div>

        <div className="mt-4 h-72 w-full">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#787774' }} />
                <YAxis tick={{ fontSize: 10, fill: '#787774' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAEAEA',
                    borderRadius: '0px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="income" fill="#346538" radius={0} maxBarSize={36} />
                <Bar dataKey="expense" fill="#9F2F2D" radius={0} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#787774]">
              Belum ada tren historis transaksi
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
