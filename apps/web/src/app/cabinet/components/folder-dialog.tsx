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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

interface FolderDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  folderToEdit: any | null
  folderForm: any
  folders: any[]
  onClose: () => void
}

export function FolderDialog({
  isOpen,
  onOpenChange,
  folderToEdit,
  folderForm,
  folders,
  onClose,
}: FolderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {folderToEdit ? "Edit Folder" : "New Folder"}
          </DialogTitle>
          <DialogDescription>
            Cabinet collection management
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            folderForm.handleSubmit()
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <folderForm.Field
              name="name"
              children={(field: any) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Folder Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      placeholder="e.g. Design Inspiration"
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

            <folderForm.Field
              name="description"
              children={(field: any) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Description (optional)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      placeholder="Short notes about this collection..."
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

            <folderForm.Field
              name="parentId"
              children={(field: any) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Parent Folder (optional)
                    </FieldLabel>
                    <Select
                      value={field.state.value || ""}
                      onValueChange={(val) =>
                        field.handleChange(val === "" ? null : val)
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        className="rounded-none border-brand-border"
                      >
                        <SelectValue placeholder="Root (No parent folder)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          Root (No parent folder)
                        </SelectItem>
                        {folders
                          .filter((f) =>
                            folderToEdit ? f.id !== folderToEdit.id : true
                          )
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
          </FieldGroup>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-xs uppercase"
            >
              Cancel
            </Button>
            <folderForm.Subscribe
              selector={(state: any) => [
                state.canSubmit,
                state.isSubmitting,
              ]}
              children={([canSubmit, isSubmitting]: any) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="flex-1 text-xs uppercase"
                >
                  {isSubmitting ? (
                    <Spinner className="h-3.5 w-3.5 animate-spin" />
                  ) : folderToEdit ? (
                    "Save Changes"
                  ) : (
                    "Save Folder"
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
