import React from 'react';
import { Card } from '@atlas/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@atlas/ui/components/table';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Vault,
  PiggyBank,
} from '@phosphor-icons/react';

interface IncomeExpenseReportProps {
  trends: Array<{ month: string; income: number; expense: number }>;
  totalIncome: number;
  totalExpense: number;
}

export function IncomeExpenseReport({
  trends = [],
  totalIncome,
  totalExpense,
}: IncomeExpenseReportProps) {
  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex flex-col gap-6">
      {/* Report KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#787774]">
            <span>Total Income</span>
            <ArrowDownLeft className="size-4 text-[#346538]" />
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-[#346538]">
            {formatCurrency(totalIncome)}
          </div>
        </Card>

        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#787774]">
            <span>Total Expenses</span>
            <ArrowUpRight className="size-4 text-[#9F2F2D]" />
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-[#9F2F2D]">
            {formatCurrency(totalExpense)}
          </div>
        </Card>

        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#787774]">
            <span>Net Surplus</span>
            <Vault className="size-4 text-[#111111]" />
          </div>
          <div
            className={`mt-2 font-mono text-lg font-bold ${
              netSavings >= 0 ? 'text-[#346538]' : 'text-[#9F2F2D]'
            }`}
          >
            {formatCurrency(netSavings)}
          </div>
        </Card>

        <Card className="rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#787774]">
            <span>Savings Rate</span>
            <PiggyBank className="size-4 text-[#346538]" />
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-[#111111]">
            {savingsRate}%
          </div>
        </Card>
      </div>

      {/* Historical Breakdown Table */}
      <Card className="rounded-none border border-[#EAEAEA] bg-white p-5 shadow-2xs">
        <h3 className="font-serif text-sm font-bold text-[#111111] border-b border-[#EAEAEA] pb-3">
          Monthly Cash Flow History Summary
        </h3>

        <div className="mt-4 rounded-none border border-[#EAEAEA] overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#F7F6F3]">
              <TableRow className="border-[#EAEAEA]">
                <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                  Month
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                  Income
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                  Expenses
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                  Net Surplus
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trends.length > 0 ? (
                trends.map((item, idx) => {
                  const net = item.income - item.expense;
                  return (
                    <TableRow key={idx} className="border-[#EAEAEA] hover:bg-[#F7F6F3]/50">
                      <TableCell className="font-mono text-xs font-semibold text-[#111111]">
                        {item.month}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-[#346538]">
                        {formatCurrency(item.income)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-[#9F2F2D]">
                        {formatCurrency(item.expense)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-xs font-bold ${
                          net >= 0 ? 'text-[#346538]' : 'text-[#9F2F2D]'
                        }`}
                      >
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-xs text-[#787774]">
                    No historical data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
