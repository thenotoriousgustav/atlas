import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { Field, FieldLabel, FieldError } from '@atlas/ui/components/field';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  targetAmount: z.string(),
});

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
  const isGroupMode = mode === 'createGroup' || mode === 'editGroup';
  const isEditMode = mode === 'editGroup' || mode === 'editCategory';

  const form = useForm({
    defaultValues: {
      name: '',
      targetAmount: '',
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      if (isGroupMode) {
        onSubmitGroup(value.name.trim(), isEditMode ? targetItem?.id : undefined);
      } else {
        const gId = parentGroupId || targetItem?.categoryGroupId;
        if (!gId) return;
        const numTarget = parseDotsToNumber(value.targetAmount || '');
        onSubmitCategory(
          value.name.trim(),
          gId,
          numTarget > 0 ? numTarget : undefined,
          isEditMode ? targetItem?.id : undefined
        );
      }
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && targetItem) {
        form.setFieldValue('name', targetItem.name || '');
        form.setFieldValue(
          'targetAmount',
          formatNumberWithDots(targetItem.targetAmount ?? '')
        );
      } else {
        form.reset();
      }
    }
  }, [mode, targetItem, isOpen, isEditMode]);

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="mt-4 space-y-4"
        >
          {/* Name Field */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    {isGroupMode ? 'Category Group Name' : 'Category Name'}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={
                      isGroupMode
                        ? 'e.g. Needs, Subscriptions, Lifestyle'
                        : 'e.g. Electricity, Dining Out, Groceries'
                    }
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          {!isGroupMode && (
            <form.Field
              name="targetAmount"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Monthly Budget Target (IDR)
                  </FieldLabel>
                  <InputGroup className="h-9 rounded-none border-[#EAEAEA]">
                    <InputGroupAddon>
                      <InputGroupText className="font-mono text-xs font-semibold text-[#111111]">
                        Rp
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      name={field.name}
                      type="text"
                      inputMode="numeric"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(formatNumberWithDots(e.target.value))
                      }
                      placeholder="0"
                      className="font-mono text-xs text-[#111111]"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText className="font-mono text-[10px] text-[#787774]">
                        IDR
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              )}
            />
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
