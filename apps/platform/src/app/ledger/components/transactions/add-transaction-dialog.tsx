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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from '@atlas/ui/components/input-group';
import { Field, FieldLabel, FieldError } from '@atlas/ui/components/field';
import { formatNumberWithDots, parseDotsToNumber } from '../../utils/currency-format';
import { DatePicker } from '../shared/date-picker';

const transactionSchema = z.object({
  title: z.string().min(2, 'Transaction title must be at least 2 characters'),
  amount: z
    .string()
    .refine((val) => parseDotsToNumber(val) > 0, 'Amount must be greater than 0'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  date: z.date(),
  accountId: z.string().min(1, 'Please select an account'),
  categoryId: z.string(),
  payee: z.string(),
  memo: z.string(),
});

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
    date: string;
    accountId: string;
    categoryId?: string;
    payee?: string;
    memo?: string;
  }) => void;
  transactionToEdit?: any | null;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; categoryGroup?: { name: string } }>;
}

export function AddTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  accounts = [],
  categories = [],
}: AddTransactionDialogProps) {
  const form = useForm({
    defaultValues: {
      title: '',
      amount: '',
      type: 'EXPENSE' as 'EXPENSE' | 'INCOME' | 'TRANSFER',
      date: new Date(),
      accountId: accounts[0]?.id || '',
      categoryId: '',
      payee: '',
      memo: '',
    },
    validators: {
      onChange: transactionSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        title: value.title.trim(),
        amount: parseDotsToNumber(value.amount),
        type: value.type,
        date: value.date ? value.date.toISOString() : new Date().toISOString(),
        accountId: value.accountId,
        categoryId: value.categoryId || undefined,
        payee: value.payee?.trim() || undefined,
        memo: value.memo?.trim() || undefined,
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        form.setFieldValue('title', transactionToEdit.title || '');
        form.setFieldValue('amount', formatNumberWithDots(transactionToEdit.amount ?? ''));
        form.setFieldValue('type', transactionToEdit.type || 'EXPENSE');
        form.setFieldValue(
          'date',
          transactionToEdit.date ? new Date(transactionToEdit.date) : new Date()
        );
        form.setFieldValue('accountId', transactionToEdit.accountId || accounts[0]?.id || '');
        form.setFieldValue('categoryId', transactionToEdit.categoryId || '');
        form.setFieldValue('payee', transactionToEdit.payee || '');
        form.setFieldValue('memo', transactionToEdit.memo || '');
      } else {
        form.reset();
        if (accounts.length > 0 && accounts[0]?.id) {
          form.setFieldValue('accountId', accounts[0].id);
        }
      }
    }
  }, [transactionToEdit, isOpen, accounts]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
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
          {/* Title Field */}
          <form.Field
            name="title"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Title / Description</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Weekly Grocery, Salary, Internet Bill"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-2 gap-3">
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
                    <FieldLabel htmlFor={field.name}>Transaction Type</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#EAEAEA]">
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={errors} />}
                  </Field>
                );
              }}
            />

            {/* Amount Field */}
            <form.Field
              name="amount"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors.map((err) =>
                  typeof err === 'string' ? { message: err } : err
                );
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Amount (IDR)</FieldLabel>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Account Field */}
            <form.Field
              name="accountId"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors.map((err) =>
                  typeof err === 'string' ? { message: err } : err
                );
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Account</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#EAEAEA]">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={errors} />}
                  </Field>
                );
              }}
            />

            {/* Category Field */}
            <form.Field
              name="categoryId"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.categoryGroup?.name ? `${cat.categoryGroup.name} → ` : ''}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date Field */}
            <form.Field
              name="date"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors.map((err) =>
                  typeof err === 'string' ? { message: err } : err
                );
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                    <DatePicker
                      date={field.state.value}
                      setDate={(d) => field.handleChange(d || new Date())}
                      placeholder="Select date"
                    />
                    {isInvalid && <FieldError errors={errors} />}
                  </Field>
                );
              }}
            />

            {/* Payee Field */}
            <form.Field
              name="payee"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Payee / Merchant</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Tokopedia, Starbucks"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                  />
                </Field>
              )}
            />
          </div>

          {/* Memo Field */}
          <form.Field
            name="memo"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Memo / Notes</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Optional transaction memo"
                  className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                />
              </Field>
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
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
