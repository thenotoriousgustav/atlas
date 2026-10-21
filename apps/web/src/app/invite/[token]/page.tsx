"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = /^[a-f0-9]{64}$/.test(token)

  async function join() {
    if (joining) return
    setJoining(true)
    setError(null)
    try {
      const response = await AXIOS_INSTANCE.post<{ data: { folderId: string } }>(`/v1/folders/invitations/${token}/accept`)
      router.replace(`/cabinet/folders/${encodeURIComponent(response.data.data.folderId)}`)
    } catch (failure) {
      const status = (failure as { response?: { status?: number } }).response?.status
      if (status === 401) router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)
      else setError(status === 404 ? "This invitation is invalid or no longer active. Ask the folder owner for a new link." : "Could not join the folder. Please try again.")
    } finally { setJoining(false) }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <section className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <p className="font-serif text-2xl text-foreground">Cabinet</p>
        <h1 className="text-xl font-semibold">Join a shared folder</h1>
        <p className="text-sm text-muted-foreground">Add bookmarks together. Members see bookmarks in this folder and can edit or delete only bookmarks they add. Notes and subfolders stay private.</p>
        {!valid ? <p role="alert">Invalid invitation link.</p> : isPending ? <p role="status">Checking your session…</p> : session ? (
          <><p className="text-xs text-muted-foreground">Joining as {session.user.name}.</p><Button onClick={join} disabled={joining}>{joining ? "Joining…" : "Join folder"}</Button></>
        ) : <Button asChild><a href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in to join</a></Button>}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      </section>
    </main>
  )
}
