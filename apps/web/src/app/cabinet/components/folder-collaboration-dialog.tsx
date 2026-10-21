"use client"

import { useId, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users } from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Collaboration = { inviteEnabled: boolean; members: { userId: string; user: { name: string } }[] }

export function FolderCollaborationDialog({ folder }: { folder: { id: string; name: string } }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const inputId = useId()
  const queryClient = useQueryClient()
  const endpoint = `/v1/folders/${folder.id}`
  const queryKey = [endpoint, "collaboration"]
  const collaboration = useQuery({
    queryKey, enabled: open,
    queryFn: async ({ signal }) => (await AXIOS_INSTANCE.get<{ data: Collaboration }>(`${endpoint}/collaboration`, { signal })).data.data,
  })
  const mutation = useMutation({
    mutationFn: async (action: { type: "invite" | "disable" | "remove"; memberId?: string }) => {
      if (action.type === "invite") {
        const response = await AXIOS_INSTANCE.put<{ data: { token: string } }>(`${endpoint}/invitation`)
        setToken(response.data.data.token)
      } else {
        await AXIOS_INSTANCE.delete(action.type === "remove" ? `${endpoint}/members/${action.memberId}` : `${endpoint}/invitation`)
        setToken(null)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
    },
  })
  const invitation = token && typeof window !== "undefined" ? `${window.location.origin}/invite/${token}` : ""
  const busy = mutation.isPending || collaboration.isFetching

  async function copyInvitation() {
    try { await navigator.clipboard.writeText(invitation); toast.success("Invitation copied") }
    catch { toast.error("Could not copy. Select the invitation and copy it manually.") }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); mutation.reset() }}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Users data-icon="inline-start" /> Invite friends</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">Collaborate in {folder.name}</DialogTitle>
          <DialogDescription>Anyone with this invitation can sign in and join this folder. Members see bookmarks and can add, edit, or delete only their own bookmarks. Notes and subfolders are not shared.</DialogDescription>
        </DialogHeader>
        {collaboration.isPending ? <p role="status">Loading members…</p> : collaboration.isError ? (
          <Alert variant="destructive"><AlertDescription>Could not load members. <Button variant="outline" size="sm" onClick={() => void collaboration.refetch()}>Try again</Button></AlertDescription></Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Creating a new invitation disables the previous link. Disabling invitations does not remove existing members.</p>
            {invitation && <Field>
              <FieldLabel htmlFor={inputId}>Invitation link</FieldLabel>
              <Input id={inputId} value={invitation} readOnly onFocus={(event) => event.currentTarget.select()} />
              <Button variant="outline" size="sm" onClick={copyInvitation}>Copy invitation</Button>
            </Field>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => mutation.mutate({ type: "invite" })}>{collaboration.data.inviteEnabled ? "Create new invitation" : "Create invitation"}</Button>
              {collaboration.data.inviteEnabled && <Button variant="outline" size="sm" disabled={busy} onClick={() => mutation.mutate({ type: "disable" })}>Disable invitation</Button>}
            </div>
            <section className="flex flex-col gap-2" aria-label="Folder members">
              <h3 className="text-sm font-medium">Members ({collaboration.data.members.length})</h3>
              <p className="text-xs text-muted-foreground">Removing a member also disables the invitation link. Their bookmarks remain in the folder.</p>
              {collaboration.data.members.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
              {collaboration.data.members.map((member) => <div key={member.userId} className="flex items-center justify-between gap-2 border-t py-2">
                <span className="truncate">{member.user.name}</span>
                <Button variant="outline" size="sm" disabled={busy} aria-label={`Remove ${member.user.name}`} onClick={() => mutation.mutate({ type: "remove", memberId: member.userId })}>Remove</Button>
              </div>)}
            </section>
          </div>
        )}
        {mutation.isError && <Alert variant="destructive"><AlertDescription>Could not update collaboration. Please try again.</AlertDescription></Alert>}
      </DialogContent>
    </Dialog>
  )
}
