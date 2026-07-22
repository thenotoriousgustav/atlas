import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Plus, ArrowsLeftRight, CaretDown, CaretRight, PencilSimple, Trash } from '@phosphor-icons/react';

interface CategoryItem {
  id: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  targetAmount?: number;
}

interface CategoryGroupItem {
  id: string;
  name: string;
  categories: CategoryItem[];
}

interface ZeroBasedBudgetGridProps {
  groups: CategoryGroupItem[];
  readyToAssign: number;
  budgetMonth: number;
  budgetYear: number;
  onUpdateAssigned: (categoryId: string, assigned: number) => void;
  onOpenAssignModal: () => void;
  onOpenMoveBudgetModal: (sourceCategoryId?: string) => void;
  onAddCategoryGroup: () => void;
  onAddCategory: (groupId: string) => void;
  onEditCategory: (cat: any) => void;
  onDeleteCategory: (catId: string) => void;
}

export function ZeroBasedBudgetGrid({
  groups = [],
  readyToAssign = 0,
  budgetMonth,
  budgetYear,
  onUpdateAssigned,
  onOpenAssignModal,
  onOpenMoveBudgetModal,
  onAddCategoryGroup,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: ZeroBasedBudgetGridProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar with Month Switcher & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-[#EAEAEA] bg-white p-4 shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Zero-Based Budget Period
          </span>
          <div className="font-sans text-lg font-bold text-[#111111]">
            {monthNames[budgetMonth - 1]} {budgetYear}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => onOpenMoveBudgetModal()}
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-none border-[#EAEAEA] text-xs font-medium text-[#111111] hover:bg-[#F7F6F3]"
          >
            <ArrowsLeftRight className="size-3.5" />
            <span>Move Budget (Rule 3)</span>
          </Button>

          <Button
            onClick={onAddCategoryGroup}
            size="sm"
            className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
          >
            <Plus className="size-3.5" />
            <span>Tambah Category Group</span>
          </Button>
        </div>
      </div>

      {/* Main Budget Grid */}
      <div className="overflow-hidden rounded-none border border-[#EAEAEA] bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#EAEAEA] bg-[#F7F6F3] text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            <tr>
              <th className="p-3">Category Name</th>
              <th className="p-3 text-right">Target</th>
              <th className="p-3 text-right">Assigned (Rule 1)</th>
              <th className="p-3 text-right">Activity (Spent)</th>
              <th className="p-3 text-right">Available</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEA]">
            {groups.length > 0 ? (
              groups.map((group) => {
                const groupAssigned = group.categories.reduce((acc, c) => acc + (c.assigned || 0), 0);
                const groupActivity = group.categories.reduce((acc, c) => acc + (c.activity || 0), 0);
                const groupAvailable = group.categories.reduce((acc, c) => acc + (c.available || 0), 0);

                return (
                  <React.Fragment key={group.id}>
                    {/* Category Group Header Row */}
                    <tr className="bg-[#F9F9F8] font-medium text-[#111111]">
                      <td className="p-3 font-semibold" colSpan={1}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wider text-[#111111]">
                            {group.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddCategory(group.id)}
                            className="h-6 gap-1 rounded-none px-2 text-[10px] text-[#787774] hover:bg-[#EAEAEA]"
                          >
                            <Plus className="size-3" />
                            <span>Kategori</span>
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 text-right text-[11px] font-mono text-[#787774]">
                        -
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#111111]">
                        {formatCurrency(groupAssigned)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#787774]">
                        {formatCurrency(groupActivity)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#111111]">
                        {formatCurrency(groupAvailable)}
                      </td>
                      <td className="p-3 text-center"></td>
                    </tr>

                    {/* Category Rows */}
                    {group.categories.map((cat) => (
                      <tr key={cat.id} className="transition-colors hover:bg-[#F7F6F3]/50">
                        <td className="p-3 pl-6">
                          <span className="font-medium text-[#111111]">{cat.name}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-[#787774]">
                          {cat.targetAmount ? formatCurrency(cat.targetAmount) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <input
                            type="number"
                            defaultValue={cat.assigned || 0}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== cat.assigned) {
                                onUpdateAssigned(cat.id, val);
                              }
                            }}
                            className="w-28 rounded-none border border-[#EAEAEA] bg-white px-2 py-1 text-right font-mono text-xs font-semibold text-[#111111] focus:border-[#111111] focus:outline-hidden"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-[#787774]">
                          {formatCurrency(cat.activity || 0)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span
                            className={`inline-block rounded-none px-2 py-0.5 font-bold ${
                              cat.available > 0
                                ? 'bg-[#EDF3EC] text-[#346538]'
                                : cat.available < 0
                                ? 'bg-[#FDEBEC] text-[#9F2F2D]'
                                : 'bg-[#F7F6F3] text-[#787774]'
                            }`}
                          >
                            {formatCurrency(cat.available || 0)}
                          </span>
                          {cat.available < 0 && (
                            <button
                              onClick={() => onOpenMoveBudgetModal(cat.id)}
                              className="ml-2 text-[10px] font-medium text-[#9F2F2D] underline underline-offset-2"
                            >
                              Cover
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditCategory(cat)}
                              className="size-6 rounded-none text-[#787774] hover:bg-[#F7F6F3]"
                            >
                              <PencilSimple className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteCategory(cat.id)}
                              className="size-6 rounded-none text-[#9F2F2D] hover:bg-[#FDEBEC]"
                            >
                              <Trash className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-[#787774]">
                  Belum ada Category Group atau Kategori Anggaran. Klik tombol di atas untuk membuat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
