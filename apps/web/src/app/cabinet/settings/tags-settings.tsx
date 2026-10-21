"use client"

import React from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowsMerge, DotsThree, MagnifyingGlass, PencilSimple, Hash as TagIcon, Trash } from "@phosphor-icons/react"
import { AXIOS_INSTANCE, useTagsControllerFindAll } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { RenameTagDialog } from "../components/rename-tag-dialog"

const itemCount = (count: number) => (count === 1 ? "1 item" : `${count} items`)

function MergeTagDialog({ source, tags, onOpenChange, onMerged }: {
  source: any | null
  tags: any[]
  onOpenChange: (open: boolean) => void
  onMerged: () => Promise<unknown>
}) {
  const [targetId, setTargetId] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  React.useEffect(() => { if (source) setTargetId("") }, [source])
  const target = tags.find((tag) => tag.id === targetId)

  const merge = async () => {
    if (!source || !target) return
    setSaving(true)
    try {
      await AXIOS_INSTANCE.post(`/v1/tags/${source.id}/merge`, { targetId })
      await onMerged()
      toast.success(`Merged #${source.name} into #${target.name}`)
      onOpenChange(false)
    } catch {
      toast.error("Could not merge the tags. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Merge #{source?.name}</DialogTitle>
          <DialogDescription>
            Items tagged #{source?.name} get the tag you choose, then #{source?.name} is deleted.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="merge-target">Merge into</FieldLabel>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger id="merge-target" className="w-full">
              <SelectValue placeholder="Choose a tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tags.filter((tag) => tag.id !== source?.id).map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>#{tag.name} · {itemCount(tag.bookmarkCount ?? 0)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void merge()} disabled={!target || saving}>{saving && <Spinner />}Merge tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TagsSettings() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useTagsControllerFindAll()
  const tags: any[] = (data as any)?.data || []
  const [query, setQuery] = React.useState("")
  const [toRename, setToRename] = React.useState<any | null>(null)
  const [toMerge, setToMerge] = React.useState<any | null>(null)
  const [cleaning, setCleaning] = React.useState(false)

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["/v1/tags"] }),
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] }),
    queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] }),
  ])

  const search = query.trim().replace(/^#/, "").toLowerCase()
  const filtered = search ? tags.filter((tag) => tag.name.includes(search)) : tags
  const unused = tags.filter((tag) => (tag.bookmarkCount ?? 0) === 0)

  const remove = async (tag: any) => {
    const count = tag.bookmarkCount ?? 0
    const confirmed = await confirm({
      title: `Delete #${tag.name}?`,
      description: count > 0
        ? `The tag is removed from ${itemCount(count)}. The items themselves are kept.`
        : "No items use this tag.",
      actionLabel: "Delete tag",
      variant: "destructive",
    })
    if (!confirmed) return
    try {
      await AXIOS_INSTANCE.delete(`/v1/tags/${tag.id}`)
      await refresh()
      toast.success(`Deleted #${tag.name}`)
    } catch {
      toast.error("Could not delete the tag")
    }
  }

  const removeUnused = async () => {
    const confirmed = await confirm({
      title: `Delete ${unused.length === 1 ? "1 unused tag" : `${unused.length} unused tags`}?`,
      description: "These tags are not on any item outside the Trash. Items in the Trash lose them too.",
      actionLabel: "Delete unused",
      variant: "destructive",
    })
    if (!confirmed) return
    setCleaning(true)
    try {
      const response = await AXIOS_INSTANCE.delete("/v1/tags/unused")
      const deleted = response.data?.data?.deleted ?? unused.length
      await refresh()
      toast.success(`Deleted ${deleted === 1 ? "1 tag" : `${deleted} tags`}`)
    } catch {
      toast.error("Could not delete unused tags")
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="h-11 min-w-0 flex-1 sm:h-9 sm:max-w-xs">
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tags…"
            aria-label="Search tags"
            className="text-base md:text-sm"
          />
          <InputGroupAddon align="inline-start"><MagnifyingGlass /></InputGroupAddon>
        </InputGroup>
        <Button variant="outline" disabled={unused.length === 0 || cleaning} onClick={() => void removeUnused()}>
          {cleaning ? <Spinner /> : <Trash data-icon="inline-start" />}
          {unused.length > 0 ? `Delete ${unused.length} unused` : "No unused tags"}
        </Button>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Loading tags…</p>
      ) : isError ? (
        <div role="alert" className="flex items-center gap-3 text-sm">
          Could not load your tags.
          <Button size="sm" variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">You have no tags yet. Add one to an item from its details panel.</p>
      ) : filtered.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">No tags match “{query}”.</p>
      ) : (
        <ul aria-label="Tags" className="flex max-h-[28rem] flex-col divide-y divide-border/70 overflow-y-auto rounded-md border border-border">
          {filtered.map((tag) => (
            <li key={tag.id} className="flex min-h-12 items-center gap-3 px-3">
              <TagIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Link
                href={`/cabinet/tags/${encodeURIComponent(tag.name)}`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
              >
                {tag.name}
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{itemCount(tag.bookmarkCount ?? 0)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for #${tag.name}`} title="Tag actions">
                    <DotsThree weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => setToRename(tag)}><PencilSimple />Rename</DropdownMenuItem>
                    <DropdownMenuItem disabled={tags.length < 2} onSelect={() => setToMerge(tag)}><ArrowsMerge />Merge into…</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => void remove(tag)}><Trash />Delete tag</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <RenameTagDialog tag={toRename} onOpenChange={(open) => { if (!open) setToRename(null) }} />
      <MergeTagDialog source={toMerge} tags={tags} onOpenChange={(open) => { if (!open) setToMerge(null) }} onMerged={refresh} />
    </div>
  )
}
