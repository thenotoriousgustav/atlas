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

const assignSchema = z.object({
  categoryId: z.string().min(1, 'Target category is required'),
  amount: z
    .string()
    .refine((val) => parseDotsToNumber(val) > 0, 'Amount must be greater than 0'),
});

interface AssignMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyToAssign: number;
  categories: Array<{ id: string; name: string }>;
  onAssignSubmit: (categoryId: string, amount: number) => void;
}

export function AssignMoneyModal({
  isOpen,
  onClose,
  readyToAssign,
  categories = [],
  onAssignSubmit,
}: AssignMoneyModalProps) {
  const form = useForm({
    defaultValues: {
      categoryId: '',
      amount: '',
    },
    validators: {
      onChange: assignSchema,
    },
    onSubmit: async ({ value }) => {
      onAssignSubmit(value.categoryId, parseDotsToNumber(value.amount));
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            Assign Money
          </DialogTitle>
          <p className="text-xs text-[#787774]">
            Select a target category to assign your available cash (Ready to Assign).
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
          <div className="rounded-none border border-[#346538]/20 bg-[#EDF3EC] p-3 text-[#346538]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#346538]">
              Cash Available to Assign
            </span>
            <div className="font-mono text-base font-bold">
              {formatCurrency(readyToAssign)}
            </div>
          </div>

          {/* Target Category Field */}
          <form.Field
            name="categoryId"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Select Target Category</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-none border-[#EAEAEA] text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-[#EAEAEA]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
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
                  <FieldLabel htmlFor={field.name}>Amount to Assign (IDR)</FieldLabel>
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
              Assign Funds
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
