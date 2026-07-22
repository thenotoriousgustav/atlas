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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChartBar, ChartPie as PieIcon } from '@phosphor-icons/react';

interface CashFlowChartProps {
  trendsData: Array<{ month: string; income: number; expense: number }>;
  categoryData: Array<{ name: string; amount: number }>;
}

const PASTEL_COLORS = [
  '#111111',
  '#1F6C9F',
  '#346538',
  '#956400',
  '#9F2F2D',
  '#787774',
  '#5C5B57',
];

export function CashFlowChart({ trendsData = [], categoryData = [] }: CashFlowChartProps) {
  const formatShortCurrency = (val: number) => {
    if (val >= 1000000) return `Rp${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Rp${(val / 1000).toFixed(0)}k`;
    return `Rp${val}`;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Income vs Expense Monthly Trend */}
      <Card className="flex flex-col rounded-none border border-[#EAEAEA] bg-white p-5 shadow-2xs lg:col-span-2">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <ChartBar className="size-4 text-[#111111]" />
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#111111]">
              Arus Kas & Tren Bulanan (Cash Flow)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-[#787774]">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 bg-[#346538]" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 bg-[#9F2F2D]" />
              <span>Expense</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          {trendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#787774' }}
                  axisLine={{ stroke: '#EAEAEA' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatShortCurrency}
                  tick={{ fontSize: 10, fill: '#787774' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAEAEA',
                    borderRadius: '0px',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                />
                <Bar dataKey="income" fill="#346538" radius={0} maxBarSize={32} />
                <Bar dataKey="expense" fill="#9F2F2D" radius={0} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-[#787774]">
              <p className="text-xs font-medium">Belum ada data transaksi bulanan</p>
            </div>
          )}
        </div>
      </Card>

      {/* Spending by Category Distribution */}
      <Card className="flex flex-col rounded-none border border-[#EAEAEA] bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-3">
          <PieIcon className="size-4 text-[#111111]" />
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#111111]">
            Pengeluaran Per Kategori
          </h3>
        </div>

        <div className="mt-4 flex h-64 flex-col items-center justify-center">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PASTEL_COLORS[index % PASTEL_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAEAEA',
                    borderRadius: '0px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-medium text-[#787774]">
              Belum ada data pengeluaran kategori
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
