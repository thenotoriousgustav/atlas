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

const moveBudgetSchema = z
  .object({
    fromId: z.string().min(1, 'Source category is required'),
    toId: z.string().min(1, 'Destination category is required'),
    amount: z
      .string()
      .refine((val) => parseDotsToNumber(val) > 0, 'Amount must be greater than 0'),
  })
  .refine((data) => data.fromId !== data.toId, {
    message: 'Destination category must be different from source category',
    path: ['toId'],
  });

interface MoveBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; assigned?: number }>;
  initialSourceId?: string;
  onMoveBudgetSubmit: (fromId: string, toId: string, amount: number) => void;
}

export function MoveBudgetDialog({
  isOpen,
  onClose,
  categories = [],
  initialSourceId,
  onMoveBudgetSubmit,
}: MoveBudgetDialogProps) {
  const form = useForm({
    defaultValues: {
      fromId: initialSourceId || categories[0]?.id || '',
      toId: '',
      amount: '',
    },
    validators: {
      onChange: moveBudgetSchema,
    },
    onSubmit: async ({ value }) => {
      onMoveBudgetSubmit(value.fromId, value.toId, parseDotsToNumber(value.amount));
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.setFieldValue('fromId', initialSourceId || categories[0]?.id || '');
      form.setFieldValue('toId', '');
      form.setFieldValue('amount', '');
    }
  }, [initialSourceId, categories, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            Move Budget (Rule 3)
          </DialogTitle>
          <p className="text-xs text-[#787774]">
            Move money from a category with extra funds to a category that needs it (Roll With The Punches).
          </p>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="mt-4 space-y-4"
        >
          {/* Source Category Field */}
          <form.Field
            name="fromId"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>From Category (Source)</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Select Source Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} (Assigned: Rp{(c.assigned || 0).toLocaleString('id-ID')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          {/* Destination Category Field */}
          <form.Field
            name="toId"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>To Category (Destination)</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Select Destination Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      {categories
                        .filter((c) => c.id !== form.getFieldValue('fromId'))
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} (Assigned: Rp{(c.assigned || 0).toLocaleString('id-ID')})
                          </SelectItem>
                        ))}
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
                  <FieldLabel htmlFor={field.name}>Amount to Move (IDR)</FieldLabel>
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
              Move Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
