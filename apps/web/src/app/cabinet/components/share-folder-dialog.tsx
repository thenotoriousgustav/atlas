"use client"

import { useId, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShareNetwork, Copy } from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

type ShareStatus = { shareToken: string | null }

export function ShareFolderDialog({ folder }: { folder: { id: string; name: string } }) {
  const [open, setOpen] = useState(false)
  const inputId = useId()
  const queryClient = useQueryClient()
  const endpoint = `/v1/folders/${folder.id}/share`
  const queryKey = [endpoint]
  const sharing = useQuery({
    queryKey,
    enabled: open,
    queryFn: async ({ signal }) => {
      const response = await AXIOS_INSTANCE.get<{ data: ShareStatus }>(endpoint, { signal })
      return response.data.data
    },
  })
  const mutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const response = enable
        ? await AXIOS_INSTANCE.put<{ data: ShareStatus }>(endpoint)
        : await AXIOS_INSTANCE.delete<{ data: ShareStatus }>(endpoint)
      return response.data.data
    },
    onMutate: () => queryClient.cancelQueries({ queryKey }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      void queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
      toast.success(data.shareToken ? "Public link enabled" : "Sharing stopped. The old link no longer works.")
    },
  })
  const token = sharing.data?.shareToken
  const shareUrl = token && typeof window !== "undefined"
    ? new URL(`/share/${token}`, process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).href
    : ""
  const busy = mutation.isPending || sharing.isFetching

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); mutation.reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShareNetwork data-icon="inline-start" /> Share folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">Share {folder.name}</DialogTitle>
          <DialogDescription>
            Anyone with the link can view bookmark links, titles, descriptions, and images in this folder. They cannot edit your collection.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertDescription>
            Notes, archived bookmarks, and subfolders stay private. New bookmarks added directly to this folder will also be visible while sharing is on.
          </AlertDescription>
        </Alert>
        {sharing.isPending ? (
          <div role="status" aria-label="Loading sharing settings"><Skeleton className="h-16 w-full" /></div>
        ) : sharing.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load sharing settings.
              <Button variant="outline" size="sm" onClick={() => void sharing.refetch()}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : token ? (
          <Field>
            <FieldLabel htmlFor={inputId}>Public link</FieldLabel>
            <Input id={inputId} value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={copyLink} disabled={busy}>
                <Copy data-icon="inline-start" /> Copy link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">View collection</a>
              </Button>
            </div>
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground">This folder is private. Create a link when you are ready to share it.</p>
        )}
        {mutation.isError && (
          <Alert variant="destructive"><AlertDescription>Could not update sharing. Please try again.</AlertDescription></Alert>
        )}
        {sharing.isSuccess && (
          <DialogFooter>
            <Button
              variant={token ? "destructive" : "default"}
              disabled={busy}
              onClick={() => mutation.mutate(!token)}
            >
              {mutation.isPending ? "Updating…" : token ? "Stop sharing" : "Create public link"}
            </Button>
          </DialogFooter>
        )}
        <p className="text-xs text-muted-foreground">
          Recipients can forward this link. Stopping sharing blocks future access, but cannot remove copies already saved by others.
        </p>
      </DialogContent>
    </Dialog>
  )
}
