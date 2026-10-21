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
import { Trash } from "@phosphor-icons/react"
import { useConfirm } from "@/hooks/use-confirm"

interface TagDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tagForm: any
  isCreatingTag: boolean
  tags?: any[]
  onDeleteTag?: (id: string) => void
  onClose: () => void
}

export function TagDialog({
  isOpen,
  onOpenChange,
  tagForm,
  isCreatingTag,
  tags = [],
  onDeleteTag,
  onClose,
}: TagDialogProps) {
  const confirm = useConfirm()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tags</DialogTitle>
          <DialogDescription>
            Create and manage tags for your library
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

        {tags && tags.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Existing tags ({tags.length})
            </span>
            <div className="flex max-h-40 flex-col divide-y divide-border/60 overflow-y-auto rounded-md border border-border bg-card">
              {tags.map((tag: any) => (
                <div key={tag.id || tag.name} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="font-medium text-foreground">#{tag.name}</span>
                  {onDeleteTag && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title: "Delete Tag",
                          description: `Are you sure you want to delete tag "${tag.name}"? This will untag all associated bookmarks.`,
                          actionLabel: "Delete",
                          variant: "destructive",
                        })
                        if (isConfirmed) onDeleteTag(tag.id)
                      }}
                      className="size-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={`Delete #${tag.name}`}
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
