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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@atlas/ui/components/select';
import { Checkbox } from '@atlas/ui/components/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { Field, FieldLabel, FieldError } from '@atlas/ui/components/field';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';

const accountSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET']),
  balance: z.string(),
  isOnBudget: z.boolean(),
});

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    isOnBudget: boolean;
  }) => void;
  accountToEdit?: any | null;
}

export function AddAccountDialog({
  isOpen,
  onClose,
  onSubmit,
  accountToEdit,
}: AddAccountDialogProps) {
  const getValidType = (rawType?: string) => {
    if (rawType && ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'E_WALLET'].includes(rawType)) {
      return rawType;
    }
    return 'CHECKING';
  };

  const form = useForm({
    defaultValues: {
      name: '',
      type: 'CHECKING',
      balance: '0',
      isOnBudget: true,
    },
    validators: {
      onChange: accountSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        name: value.name.trim(),
        type: value.type,
        balance: parseDotsToNumber(value.balance),
        isOnBudget: value.isOnBudget,
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        form.setFieldValue('name', accountToEdit.name || '');
        form.setFieldValue('type', getValidType(accountToEdit.type));
        form.setFieldValue('balance', formatNumberWithDots(accountToEdit.balance ?? '0'));
        form.setFieldValue('isOnBudget', accountToEdit.isOnBudget ?? true);
      } else {
        form.reset();
      }
    }
  }, [accountToEdit, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {accountToEdit ? 'Edit Account' : 'Add New Account'}
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
                  <FieldLabel htmlFor={field.name}>Account Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Bank Mandiri, GoPay, BCA"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          {/* Type Field */}
          <form.Field
            name="type"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Account Type</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      <SelectItem value="CHECKING">Checking Account</SelectItem>
                      <SelectItem value="SAVINGS">Savings Account</SelectItem>
                      <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          {/* Balance Field */}
          <form.Field
            name="balance"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Current Balance (IDR)</FieldLabel>
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
                      aria-invalid={isInvalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText className="font-mono text-[10px] text-[#787774]">
                        IDR
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          {/* IsOnBudget Checkbox */}
          <form.Field
            name="isOnBudget"
            children={(field) => (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(!!checked)}
                  className="rounded-none border-[#CCCCCC] data-[state=checked]:bg-[#111111]"
                />
                <FieldLabel htmlFor={field.name} className="text-xs text-[#111111] font-normal cursor-pointer">
                  Include in Budget (On-Budget)
                </FieldLabel>
              </div>
            )}
          />

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
              Save Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
