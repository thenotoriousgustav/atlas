"use client"

import React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const cleanTagName = (value: string) => value.trim().replace(/^#/, "").trim().toLowerCase()

export function RenameTagDialog({ tag, onOpenChange, onRenamed }: {
  tag: { id: string; name: string } | null
  onOpenChange: (open: boolean) => void
  onRenamed?: (oldName: string, newName: string) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (tag) {
      setName(tag.name)
      setError(null)
    }
  }, [tag])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tag) return
    const next = cleanTagName(name)
    if (!next) return setError("Enter a tag name.")
    if (next.length > 30) return setError("Use at most 30 characters.")
    if (next === tag.name) return onOpenChange(false)
    setSaving(true)
    try {
      await AXIOS_INSTANCE.patch(`/v1/tags/${tag.id}`, { name: next })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/v1/tags"] }),
        queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] }),
        queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] }),
      ])
      onRenamed?.(tag.name, next)
      toast.success(`Renamed to #${next}`)
      onOpenChange(false)
    } catch (err: any) {
      setError(
        err?.response?.status === 409
          ? `#${next} already exists. Choose another name.`
          : "Could not rename the tag. Try again."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!tag} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename tag</DialogTitle>
          <DialogDescription>Every item tagged #{tag?.name} keeps the tag under its new name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="rename-tag-input">Tag name</FieldLabel>
            <Input
              id="rename-tag-input"
              value={name}
              autoFocus
              maxLength={31}
              aria-invalid={!!error}
              onChange={(event) => { setName(event.target.value); setError(null) }}
              className="text-base md:text-sm"
            />
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !cleanTagName(name)}>
              {saving && <Spinner />}Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
