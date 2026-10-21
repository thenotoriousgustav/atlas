"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

interface TagDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tagForm: any
  isCreatingTag: boolean
  onClose: () => void
}

export function TagDialog({
  isOpen,
  onOpenChange,
  tagForm,
  isCreatingTag,
  onClose,
}: TagDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>New Tag</DialogTitle>
          <DialogDescription>
            Create a tag label to organize your bookmarks
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            tagForm.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <tagForm.Field
            name="name"
            children={(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Tag Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    placeholder="e.g. design, ai, reading"
                    autoFocus
                  />
                  {isInvalid && (
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) =>
                        typeof err === "string" ? { message: err } : err
                      )}
                    />
                  )}
                </Field>
              )
            }}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <tagForm.Subscribe
              selector={(state: any) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]: any) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isCreatingTag}
                  className="flex-1"
                >
                  {isSubmitting || isCreatingTag ? (
                    <Spinner className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create Tag"
                  )}
                </Button>
              )}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
