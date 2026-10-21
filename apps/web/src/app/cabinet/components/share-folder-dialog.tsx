"use client"

import React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Globe, Link as LinkIcon, LockSimple, ShareNetwork } from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { folderRoles, type FolderRole } from "@/lib/folder-roles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/sonner"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type Person = { name: string; email?: string | null; avatar?: string | null }
type Member = { userId: string; role: FolderRole; user: Person }
type Collaboration = {
  owner?: Person & { id: string }
  inviteEnabled: boolean
  inviteRole?: FolderRole
  members: Member[]
}

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message && typeof error.response.data.message === "string"
    ? error.response.data.message
    : fallback

function Initial({ person }: { person: Person }) {
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
      {(person.name || person.email || "?").trim().charAt(0).toUpperCase()}
    </span>
  )
}

function RoleSelect({ value, onChange, onRemove, disabled, label }: {
  value: FolderRole
  onChange: (role: FolderRole) => void
  onRemove?: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === "__remove__") onRemove?.()
        else onChange(next as FolderRole)
      }}
    >
      <SelectTrigger size="sm" aria-label={label} className="w-auto shrink-0 border-none bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-muted">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {folderRoles.map((role) => (
            <SelectItem key={role.value} value={role.value} description={role.description}>{role.label}</SelectItem>
          ))}
        </SelectGroup>
        {onRemove && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="__remove__" className="text-destructive focus:text-destructive">Remove access</SelectItem>
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  )
}

function PersonRow({ person, you, children }: { person: Person; you?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex min-h-12 items-center gap-3">
      <Initial person={person} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {person.name || person.email}
          {you && <span className="text-muted-foreground"> (you)</span>}
        </p>
        {person.email && person.name && <p className="truncate text-xs text-muted-foreground">{person.email}</p>}
      </div>
      {children}
    </li>
  )
}

function AccessRow({ icon, title, subline, action }: {
  icon: React.ReactNode
  title: React.ReactNode
  subline: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <li className="flex min-h-12 items-center gap-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex min-h-7 items-center text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{subline}</div>
      </div>
      {action}
    </li>
  )
}

/** Status text and its actions on one line, separated by quiet dots. */
function Actions({ children }: { children: React.ReactNode }) {
  const parts = React.Children.toArray(children).flatMap((child) =>
    React.isValidElement(child) && child.type === React.Fragment
      ? React.Children.toArray((child.props as { children?: React.ReactNode }).children)
      : [child]
  )
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span aria-hidden="true">·</span>}
          {part}
        </React.Fragment>
      ))}
    </span>
  )
}

function TextAction({ children, onClick, disabled, label }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn("rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50")}
    >
      {children}
    </button>
  )
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error("Could not copy. Select the link and copy it manually.")
  }
}

/** One place to share a folder, modeled on Google Drive: people, roles, an invite link, and public access. */
export function ShareFolderDialog({ folder }: { folder: { id: string; name: string } }) {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const endpoint = `/v1/folders/${folder.id}`
  const collaborationKey = [endpoint, "collaboration"]
  const shareKey = [`${endpoint}/share`]

  const collaboration = useQuery({
    queryKey: collaborationKey,
    enabled: open,
    queryFn: async ({ signal }) =>
      (await AXIOS_INSTANCE.get<{ data: Collaboration }>(`${endpoint}/collaboration`, { signal })).data.data,
  })
  const sharing = useQuery({
    queryKey: shareKey,
    enabled: open,
    queryFn: async ({ signal }) =>
      (await AXIOS_INSTANCE.get<{ data: { shareToken: string | null } }>(`${endpoint}/share`, { signal })).data.data,
  })

  const [email, setEmail] = React.useState("")
  const [newRole, setNewRole] = React.useState<FolderRole>("VIEWER")
  const [addError, setAddError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  // The server stores only a hash, so a link can be shown only right after it is created.
  const [inviteToken, setInviteToken] = React.useState<string | null>(null)
  // Role for a link that does not exist yet; an active link's role lives on the server.
  const [draftInviteRole, setDraftInviteRole] = React.useState<FolderRole>("VIEWER")

  React.useEffect(() => {
    if (!open) {
      setEmail("")
      setAddError(null)
      setInviteToken(null)
    }
  }, [open])

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: collaborationKey }),
    queryClient.invalidateQueries({ queryKey: ["/v1/folders"] }),
  ])

  const run = async (key: string, action: () => Promise<unknown>, failure: string) => {
    setBusy(key)
    try {
      await action()
      await refresh()
      return true
    } catch (error) {
      toast.error(errorMessage(error, failure))
      return false
    } finally {
      setBusy(null)
    }
  }

  const addPerson = async (event: React.FormEvent) => {
    event.preventDefault()
    const address = email.trim()
    if (!address) return
    setBusy("add")
    setAddError(null)
    try {
      await AXIOS_INSTANCE.post(`${endpoint}/members`, { email: address, role: newRole })
      await refresh()
      setEmail("")
      toast.success(`Shared with ${address}`)
    } catch (error) {
      setAddError(errorMessage(error, "Could not share with that person. Try again."))
    } finally {
      setBusy(null)
    }
  }

  const changeRole = (member: Member, role: FolderRole) =>
    run(`role-${member.userId}`, () => AXIOS_INSTANCE.patch(`${endpoint}/members/${member.userId}`, { role }), "Could not change access")

  const removePerson = async (member: Member) => {
    if (await run(`role-${member.userId}`, () => AXIOS_INSTANCE.delete(`${endpoint}/members/${member.userId}`), "Could not remove access")) {
      // Removing someone also turns off the invite link so they cannot rejoin with it.
      setInviteToken(null)
      toast.success(`Removed ${member.user.name || member.user.email}. The invite link was turned off.`)
    }
  }

  const createInvite = (role: FolderRole) =>
    run("invite", async () => {
      const response = await AXIOS_INSTANCE.put<{ data: { token: string } }>(`${endpoint}/invitation`, { role })
      const token = response.data.data.token
      setInviteToken(token)
      // Copy right away; the Copy link action stays available if the browser refuses.
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
        toast.success("Invite link created and copied")
      } catch {
        toast.success("Invite link created")
      }
    }, "Could not create the invite link")

  const changeInviteRole = (role: FolderRole) =>
    run("invite", () => AXIOS_INSTANCE.patch(`${endpoint}/invitation`, { role }), "Could not change the link role")

  const turnOffInvite = () =>
    run("invite", async () => {
      await AXIOS_INSTANCE.delete(`${endpoint}/invitation`)
      setInviteToken(null)
    }, "Could not turn off the invite link")

  const setPublic = async (enabled: boolean) => {
    setBusy("public")
    try {
      const response = enabled
        ? await AXIOS_INSTANCE.put<{ data: { shareToken: string | null } }>(`${endpoint}/share`)
        : await AXIOS_INSTANCE.delete<{ data: { shareToken: string | null } }>(`${endpoint}/share`)
      queryClient.setQueryData(shareKey, response.data.data)
      toast.success(enabled ? "Anyone with the link can now view this folder" : "Public link turned off")
    } catch {
      toast.error("Could not update public access")
    } finally {
      setBusy(null)
    }
  }

  const data = collaboration.data
  const owner = data?.owner ?? { name: session?.user?.name || "You", email: session?.user?.email }
  const inviteRole: FolderRole = data?.inviteEnabled ? data.inviteRole ?? "CONTRIBUTOR" : draftInviteRole
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const inviteUrl = inviteToken ? `${origin}/invite/${inviteToken}` : ""
  const publicToken = sharing.data?.shareToken
  const publicUrl = publicToken ? new URL(`/share/${publicToken}`, process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost").href : ""

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShareNetwork data-icon="inline-start" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">Share “{folder.name}”</DialogTitle>
          <DialogDescription className="sr-only">
            Choose who can open this folder and its links and notes. Subfolders stay private.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={addPerson} className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setAddError(null) }}
              placeholder="Add people by email"
              aria-label="Email address"
              aria-invalid={!!addError}
              autoComplete="off"
              className="h-11 min-w-0 flex-1 text-base sm:h-9 md:text-sm"
            />
            {/* One row, one height: the field, its role, and the action line up. */}
            <>
                <Select value={newRole} onValueChange={(role) => setNewRole(role as FolderRole)}>
                  <SelectTrigger aria-label="Role for the new person" className="w-auto shrink-0 data-[size=default]:h-11 sm:data-[size=default]:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      {folderRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value} description={role.description}>{role.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={!email.trim() || busy === "add"} className="h-11 sm:h-9">
                  {busy === "add" && <Spinner />}Share
                </Button>
            </>
          </div>
          {addError && <p role="alert" className="text-xs text-destructive">{addError}</p>}
        </form>

        <section aria-labelledby="share-people" className="flex flex-col gap-2">
          <h3 id="share-people" className="text-xs font-medium text-muted-foreground">People with access</h3>
          {collaboration.isPending ? (
            <div role="status" aria-label="Loading people" className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
            </div>
          ) : collaboration.isError ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-muted-foreground">
              Could not load people with access.
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void collaboration.refetch()}>Try again</Button>
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              <PersonRow person={owner} you>
                <span className="px-2 text-sm text-muted-foreground">Owner</span>
              </PersonRow>
              {data!.members.map((member) => (
                <PersonRow key={member.userId} person={member.user}>
                  <RoleSelect
                    value={member.role ?? "CONTRIBUTOR"}
                    disabled={busy === `role-${member.userId}`}
                    label={`Access for ${member.user.name || member.user.email}`}
                    onChange={(role) => void changeRole(member, role)}
                    onRemove={() => void removePerson(member)}
                  />
                </PersonRow>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="share-general" className="flex flex-col gap-2">
          <h3 id="share-general" className="text-xs font-medium text-muted-foreground">General access</h3>
          <ul className="flex flex-col gap-1">
            <AccessRow
              icon={publicToken ? <Globe /> : <LockSimple />}
              title={
                sharing.isPending ? <Skeleton className="h-5 w-32" /> : (
                  <Select value={publicToken ? "public" : "restricted"} disabled={busy === "public" || sharing.isError} onValueChange={(value) => void setPublic(value === "public")}>
                    <SelectTrigger size="sm" aria-label="General access" className="-ml-2 h-7 w-auto border-none bg-transparent px-2 font-medium shadow-none hover:bg-muted dark:bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="restricted" description="Only people with access can open it">Restricted</SelectItem>
                        <SelectItem value="public" description="Anyone on the internet can view the links and notes, no sign-in">Anyone with the link</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )
              }
              subline={
                sharing.isError ? "Could not load public access." : publicToken ? (
                  <Actions>
                    <span>Can view links and notes, no sign-in needed</span>
                    <TextAction label="Copy public link" onClick={() => void copy(publicUrl, "Public link copied")}>Copy link</TextAction>
                  </Actions>
                ) : "Only people with access can open it"
              }
            />
            {collaboration.isSuccess && (
              <AccessRow
                icon={<LinkIcon />}
                title={<span className="font-medium">Invite link</span>}
                subline={
                  <Actions>
                    <span>{data!.inviteEnabled ? "On, joins after sign-in" : "Off"}</span>
                    {data!.inviteEnabled ? (
                      <>
                        {inviteUrl
                          ? <TextAction onClick={() => void copy(inviteUrl, "Invite link copied")} label="Copy invite link">Copy link</TextAction>
                          : <TextAction onClick={() => void createInvite(inviteRole)} disabled={busy === "invite"} label="Create a new invite link">New link</TextAction>}
                        <TextAction onClick={() => void turnOffInvite()} disabled={busy === "invite"}>Turn off</TextAction>
                      </>
                    ) : (
                      <TextAction onClick={() => void createInvite(inviteRole)} disabled={busy === "invite"} label="Create invite link">Create link</TextAction>
                    )}
                  </Actions>
                }
                action={
                  <RoleSelect
                    value={inviteRole}
                    label="Role for people who join with the link"
                    disabled={busy === "invite"}
                    onChange={(role) => { if (data!.inviteEnabled) void changeInviteRole(role); else setDraftInviteRole(role) }}
                  />
                }
              />
            )}
          </ul>
        </section>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Links, notes, and drawings are shared. Subfolders stay private.</p>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
