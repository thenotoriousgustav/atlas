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

const subscriptionSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  amount: z
    .string()
    .refine((val) => parseDotsToNumber(val) > 0, 'Cost must be greater than 0'),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
  nextBillingDate: z.date(),
  category: z.string(),
  isActive: z.boolean(),
});

interface AddSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    nextBillingDate: string;
    category?: string;
    isActive: boolean;
  }) => void;
  subscriptionToEdit?: any | null;
}

export function AddSubscriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  subscriptionToEdit,
}: AddSubscriptionDialogProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      amount: '',
      billingCycle: 'MONTHLY' as 'MONTHLY' | 'ANNUAL',
      nextBillingDate: new Date(),
      category: '',
      isActive: true,
    },
    validators: {
      onChange: subscriptionSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        name: value.name.trim(),
        amount: parseDotsToNumber(value.amount),
        billingCycle: value.billingCycle,
        nextBillingDate: value.nextBillingDate
          ? value.nextBillingDate.toISOString()
          : new Date().toISOString(),
        category: value.category?.trim() || undefined,
        isActive: value.isActive,
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (subscriptionToEdit) {
        form.setFieldValue('name', subscriptionToEdit.name || '');
        form.setFieldValue('amount', formatNumberWithDots(subscriptionToEdit.amount ?? ''));
        form.setFieldValue('billingCycle', subscriptionToEdit.billingCycle || 'MONTHLY');
        form.setFieldValue(
          'nextBillingDate',
          subscriptionToEdit.nextBillingDate
            ? new Date(subscriptionToEdit.nextBillingDate)
            : new Date()
        );
        form.setFieldValue('category', subscriptionToEdit.category || '');
        form.setFieldValue('isActive', subscriptionToEdit.isActive ?? true);
      } else {
        form.reset();
      }
    }
  }, [subscriptionToEdit, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {subscriptionToEdit ? 'Edit Subscription' : 'Add New Subscription'}
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
                  <FieldLabel htmlFor={field.name}>Service / Subscription Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Netflix, Spotify, ChatGPT Plus, iCloud"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-2 gap-3">
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
                    <FieldLabel htmlFor={field.name}>Cost (IDR)</FieldLabel>
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

            {/* Billing Cycle Field */}
            <form.Field
              name="billingCycle"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Billing Cycle</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Cycle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Next Renewal Date */}
            <form.Field
              name="nextBillingDate"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors.map((err) =>
                  typeof err === 'string' ? { message: err } : err
                );
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Next Renewal Date</FieldLabel>
                    <DatePicker
                      date={field.state.value}
                      setDate={(d) => field.handleChange(d || new Date())}
                      placeholder="Select renewal date"
                    />
                    {isInvalid && <FieldError errors={errors} />}
                  </Field>
                );
              }}
            />

            {/* Category Field */}
            <form.Field
              name="category"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Entertainment, Software"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                  />
                </Field>
              )}
            />
          </div>

          {/* Status Field */}
          <form.Field
            name="isActive"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <Select
                  value={field.state.value ? 'ACTIVE' : 'PAUSED'}
                  onValueChange={(val) => field.handleChange(val === 'ACTIVE')}
                >
                  <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#EAEAEA]">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
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
              Save Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
