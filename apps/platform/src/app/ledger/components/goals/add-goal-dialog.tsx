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
import { DatePicker } from '../shared/date-picker';

const goalSchema = z.object({
  name: z.string().min(2, 'Goal name must be at least 2 characters'),
  targetAmount: z
    .string()
    .refine((val) => parseDotsToNumber(val) > 0, 'Target amount must be greater than 0'),
  currentAmount: z.string(),
  targetDate: z.date().optional(),
});

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
  }) => void;
  goalToEdit?: any | null;
}

export function AddGoalDialog({
  isOpen,
  onClose,
  onSubmit,
  goalToEdit,
}: AddGoalDialogProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: undefined,
    } as {
      name: string;
      targetAmount: string;
      currentAmount: string;
      targetDate?: Date;
    },
    validators: {
      onChange: goalSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        name: value.name.trim(),
        targetAmount: parseDotsToNumber(value.targetAmount),
        currentAmount: parseDotsToNumber(value.currentAmount),
        targetDate: value.targetDate ? value.targetDate.toISOString() : undefined,
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        form.setFieldValue('name', goalToEdit.name || '');
        form.setFieldValue('targetAmount', formatNumberWithDots(goalToEdit.targetAmount ?? ''));
        form.setFieldValue('currentAmount', formatNumberWithDots(goalToEdit.currentAmount ?? '0'));
        form.setFieldValue(
          'targetDate',
          goalToEdit.targetDate ? new Date(goalToEdit.targetDate) : undefined
        );
      } else {
        form.reset();
      }
    }
  }, [goalToEdit, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-[#111111]">
            {goalToEdit ? 'Edit Financial Goal' : 'Add New Financial Goal'}
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
          {/* Goal Name Field */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const errors = field.state.meta.errors.map((err) =>
                typeof err === 'string' ? { message: err } : err
              );
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Goal Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Emergency Fund, House Down Payment"
                    className="h-9 rounded-none border-[#EAEAEA] text-xs focus-visible:ring-[#111111]"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={errors} />}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Target Amount Field */}
            <form.Field
              name="targetAmount"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors.map((err) =>
                  typeof err === 'string' ? { message: err } : err
                );
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Target Amount (IDR)</FieldLabel>
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

            {/* Current Amount Field */}
            <form.Field
              name="currentAmount"
              children={(field) => (
                <Field>
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
          </div>

          {/* Target Date Field */}
          <form.Field
            name="targetDate"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Target Completion Date</FieldLabel>
                <DatePicker
                  date={field.state.value}
                  setDate={(d) => field.handleChange(d)}
                  placeholder="Pick target completion date"
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
              Save Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
