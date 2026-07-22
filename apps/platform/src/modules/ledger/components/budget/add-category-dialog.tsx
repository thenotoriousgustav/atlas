import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import { Label } from '@atlas/ui/components/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'createGroup' | 'editGroup' | 'createCategory' | 'editCategory';
  parentGroupId?: string | null;
  targetItem?: any | null;
  onSubmitGroup: (name: string, id?: string) => void;
  onSubmitCategory: (
    name: string,
    groupId: string,
    targetAmount?: number,
    id?: string
  ) => void;
}

export function AddCategoryDialog({
  isOpen,
  onClose,
  mode,
  parentGroupId,
  targetItem,
  onSubmitGroup,
  onSubmitCategory,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const isGroupMode = mode === 'createGroup' || mode === 'editGroup';
  const isEditMode = mode === 'editGroup' || mode === 'editCategory';

  useEffect(() => {
    if (isEditMode && targetItem) {
      setName(targetItem.name || '');
      setTargetAmount(formatNumberWithDots(targetItem.targetAmount ?? ''));
    } else {
      setName('');
      setTargetAmount('');
    }
  }, [mode, targetItem, isOpen, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isGroupMode) {
      onSubmitGroup(name.trim(), isEditMode ? targetItem?.id : undefined);
    } else {
      const gId = parentGroupId || targetItem?.categoryGroupId;
      if (!gId) return;
      const numTarget = parseDotsToNumber(targetAmount);
      onSubmitCategory(
        name.trim(),
        gId,
        numTarget > 0 ? numTarget : undefined,
        isEditMode ? targetItem?.id : undefined
      );
    }
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'createGroup':
        return 'Add New Category Group';
      case 'editGroup':
        return 'Edit Category Group';
      case 'createCategory':
        return 'Add New Category';
      case 'editCategory':
        return 'Edit Category';
      default:
        return 'Manage Category';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#111111]">
              {isGroupMode ? 'Category Group Name' : 'Category Name'}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isGroupMode
                  ? 'e.g. Needs, Subscriptions, Lifestyle'
                  : 'e.g. Electricity, Dining Out, Groceries'
              }
              className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
              required
            />
          </div>

          {!isGroupMode && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#111111]">
                Monthly Budget Target (IDR)
              </Label>
              <InputGroup className="h-9 rounded-none border-[#EAEAEA]">
                <InputGroupAddon>
                  <InputGroupText className="font-mono text-xs font-semibold text-[#111111]">
                    Rp
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="font-mono text-xs text-[#111111]"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText className="font-mono text-[10px] text-[#787774]">
                    IDR
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-none border-[#EAEAEA] text-xs text-[#787774] hover:bg-[#F7F6F3]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              {isGroupMode ? 'Save Group' : 'Save Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
