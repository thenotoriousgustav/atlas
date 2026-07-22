import React, { useState, useEffect } from 'react';
import { Button } from '@atlas/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@atlas/ui/components/table';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import {
  Plus,
  PencilSimple,
  Trash,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

export interface BudgetCategoryItem {
  id: string;
  name: string;
  targetAmount?: number;
  assigned: number;
  activity: number;
  available: number;
}

export interface BudgetGroupItem {
  id: string;
  name: string;
  categories: BudgetCategoryItem[];
}

interface ZeroBasedBudgetGridProps {
  groups: BudgetGroupItem[];
  readyToAssign: number;
  budgetMonth: number;
  budgetYear: number;
  onUpdateAssigned: (categoryId: string, assigned: number) => void;
  onOpenAssignModal: () => void;
  onOpenMoveBudgetModal: (sourceCategoryId?: string) => void;
  onAddCategoryGroup: () => void;
  onAddCategory: (groupId: string) => void;
  onEditCategory: (category: BudgetCategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
}

function CategoryAssignedInput({
  initialValue,
  onSave,
}: {
  initialValue: number;
  onSave: (val: number) => void;
}) {
  const [value, setValue] = useState(formatNumberWithDots(initialValue ?? 0));

  useEffect(() => {
    setValue(formatNumberWithDots(initialValue ?? 0));
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatNumberWithDots(e.target.value));
  };

  const handleBlur = () => {
    const num = parseDotsToNumber(value);
    if (num !== initialValue) {
      onSave(num);
    }
  };

  return (
    <InputGroup className="h-7 w-38 ml-auto rounded-none border-[#EAEAEA] bg-white">
      <InputGroupAddon>
        <InputGroupText className="font-mono text-[11px] font-semibold text-[#111111]">
          Rp
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="0"
        className="text-right font-mono text-xs text-[#111111] px-1.5"
      />
    </InputGroup>
  );
}

export function ZeroBasedBudgetGrid({
  groups = [],
  onUpdateAssigned,
  onOpenMoveBudgetModal,
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

  return (
    <div className="flex flex-col gap-4">
      {/* Category Groups Table */}
      <div className="rounded-none border border-[#EAEAEA] bg-white shadow-2xs overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F7F6F3]">
            <TableRow className="border-[#EAEAEA]">
              <TableHead className="font-mono text-[11px] font-semibold text-[#787774]">
                Category
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                Target
              </TableHead>
              <TableHead className="w-36 text-right font-mono text-[11px] font-semibold text-[#787774]">
                Assigned
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                Activity
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] font-semibold text-[#787774]">
                Available
              </TableHead>
              <TableHead className="w-24 text-right font-mono text-[11px] font-semibold text-[#787774]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length > 0 ? (
              groups.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Category Group Header Row */}
                  <TableRow className="border-[#EAEAEA] bg-[#F7F6F3]/70 font-semibold">
                    <TableCell colSpan={5} className="py-2.5 text-xs text-[#111111]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-[11px]">
                          {group.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#787774] font-normal">
                          ({group.categories?.length || 0} categories)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddCategory(group.id)}
                        className="h-6 gap-1 rounded-none text-[10px] text-[#787774] hover:bg-white hover:text-[#111111]"
                      >
                        <Plus className="size-3" />
                        <span>Category</span>
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Category Items Rows */}
                  {group.categories && group.categories.length > 0 ? (
                    group.categories.map((cat) => {
                      const isAvailablePositive = cat.available > 0;
                      const isAvailableNegative = cat.available < 0;

                      return (
                        <TableRow
                          key={cat.id}
                          className="border-[#EAEAEA] hover:bg-[#F7F6F3]/40"
                        >
                          <TableCell className="pl-6 text-xs font-medium text-[#111111]">
                            {cat.name}
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs text-[#787774]">
                            {cat.targetAmount ? formatCurrency(cat.targetAmount) : '-'}
                          </TableCell>

                          <TableCell className="text-right">
                            <CategoryAssignedInput
                              initialValue={cat.assigned || 0}
                              onSave={(newVal) => onUpdateAssigned(cat.id, newVal)}
                            />
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs text-[#9F2F2D]">
                            {cat.activity !== 0
                              ? `-${formatCurrency(Math.abs(cat.activity))}`
                              : 'Rp0'}
                          </TableCell>

                          <TableCell className="text-right">
                            <span
                              className={`inline-block rounded-none px-2 py-0.5 font-mono text-xs font-bold ${
                                isAvailablePositive
                                  ? 'bg-[#EDF3EC] text-[#346538]'
                                  : isAvailableNegative
                                  ? 'bg-[#FDEBEC] text-[#9F2F2D]'
                                  : 'text-[#787774]'
                              }`}
                            >
                              {formatCurrency(cat.available)}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenMoveBudgetModal(cat.id)}
                                title="Move Budget from this category"
                                className="size-6 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
                              >
                                <ArrowsLeftRight className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditCategory(cat)}
                                title="Edit Category"
                                className="size-6 rounded-none text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
                              >
                                <PencilSimple className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteCategory(cat.id)}
                                title="Delete Category"
                                className="size-6 rounded-none text-[#787774] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                              >
                                <Trash className="size-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-3 pl-6 text-xs text-[#787774] italic"
                      >
                        No categories in this group yet. Click "+ Category" above to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-xs text-[#787774]">
                  No category groups found. Click "Add Group" in the page header to start budgeting.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
