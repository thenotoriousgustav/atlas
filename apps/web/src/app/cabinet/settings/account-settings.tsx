"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, GithubLogo, GoogleLogo, Trash } from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { toast } from "@/components/ui/sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

const providers = [["github", "GitHub", GithubLogo], ["google", "Google", GoogleLogo]] as const
type Provider = (typeof providers)[number][0]
const providerLabel = (id: string) => providers.find(([provider]) => provider === id)?.[1] ?? id

// Better Auth only changes sign-in methods or deletes an account for a sign-in from the last 24 hours.
const FRESH_SIGN_IN_MS = 23 * 60 * 60 * 1000
const accountsKey = ["auth", "accounts"]

const linkErrors: Record<string, string> = {
  account_already_linked_to_different_user: "That account already signs in to a different Cabinet account.",
  email_does_not_match: "That account uses a different email. Cabinet only connects accounts with the same email as yours.",
  email_not_verified: "Verify your email with that provider first, then try again.",
}

const settingsURL = (params = "") => `${window.location.origin}/cabinet/settings?tab=account${params}`

/** Signs in again with a linked provider and comes back to the account tab. */
async function signInAgain(provider: string, params = "") {
  const { error } = await authClient.signIn.social({ provider, callbackURL: settingsURL(params), errorCallbackURL: settingsURL() })
  if (error) toast.error(error.message || "Could not sign in again. Try again.")
}

function useLinkedAccounts() {
  return useQuery({
    queryKey: accountsKey,
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts()
      if (error) throw new Error(error.message || "Could not load sign-in methods")
      return data
    },
  })
}

export function SignInMethods() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const accounts = useLinkedAccounts()
  const [pending, setPending] = React.useState<Provider | null>(null)
  const [linkError, setLinkError] = React.useState("")
  // Better Auth comes back with ?error=<code> when connecting an account fails.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("error")
    if (!code) return
    setLinkError(linkErrors[code] ?? "Could not connect that account. Try again.")
    url.searchParams.delete("error")
    url.searchParams.delete("error_description")
    window.history.replaceState(window.history.state, "", url)
  }, [])

  const linked = (accounts.data ?? []).filter((account) => providers.some(([provider]) => provider === account.providerId))

  const connect = async (provider: Provider) => {
    setPending(provider)
    setLinkError("")
    const { error } = await authClient.linkSocial({ provider, callbackURL: settingsURL(), errorCallbackURL: settingsURL() })
    if (error) {
      toast.error(error.message || `Could not connect ${providerLabel(provider)}`)
      setPending(null)
    }
  }

  const disconnect = async (provider: Provider, accountId: string) => {
    const label = providerLabel(provider)
    if (!await confirm({ title: `Disconnect ${label}?`, description: `You won't be able to sign in with ${label} until you connect it again.`, actionLabel: "Disconnect", variant: "destructive" })) return
    setPending(provider)
    const { error } = await authClient.unlinkAccount({ accountId })
    setPending(null)
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: accountsKey })
      toast.success(`${label} disconnected`)
      return
    }
    if (error.code === "SESSION_NOT_FRESH") {
      if (await confirm({ title: "Sign in again to continue", description: `For your safety, sign in again before changing how you sign in. You'll come back here to finish.`, actionLabel: `Continue with ${label}` })) await signInAgain(provider)
      return
    }
    toast.error(error.message || `Could not disconnect ${label}`)
  }

  return (
    <>
      {linkError && <p role="alert" className="text-sm text-destructive">{linkError}</p>}
      <ul className="flex flex-col divide-y divide-border/70" aria-busy={accounts.isPending}>
        {providers.map(([provider, label, Icon]) => {
          const account = linked.find((entry) => entry.providerId === provider)
          return (
            <li key={provider} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {accounts.isPending ? "Checking…" : account
                      ? <><CheckCircle weight="fill" className="text-library-olive" aria-hidden="true" />Connected · since {new Date(account.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</>
                      : "Not connected"}
                  </span>
                </div>
              </div>
              {accounts.isSuccess && (account
                ? <Button variant="outline" disabled={linked.length < 2 || pending !== null} title={linked.length < 2 ? "Connect another way to sign in first" : undefined} onClick={() => void disconnect(provider, account.id)}>{pending === provider && <Spinner />}Disconnect</Button>
                : <Button variant="outline" disabled={pending !== null} onClick={() => void connect(provider)}>{pending === provider && <Spinner />}Connect</Button>)}
            </li>
          )
        })}
      </ul>
      {accounts.isError && <p role="alert" className="text-sm text-muted-foreground">Could not check your sign-in methods. <Button variant="link" className="h-auto p-0" onClick={() => void accounts.refetch()}>Try again</Button></p>}
      {linked.length === 1 && <p className="text-xs text-muted-foreground">This is your only way to sign in, so it can&apos;t be disconnected. Connect another one first.</p>}
    </>
  )
}

export function DeleteAccount() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const accounts = useLinkedAccounts()
  const [step, setStep] = React.useState<"closed" | "confirm" | "sign-in">("closed")
  const [typed, setTyped] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)
  const email = session?.user.email ?? ""
  const matches = !!email && typed.trim().toLowerCase() === email.toLowerCase()

  const open = React.useCallback(() => {
    setTyped("")
    const signedInAt = session ? new Date(session.session.createdAt).getTime() : 0
    setStep(Date.now() - signedInAt < FRESH_SIGN_IN_MS ? "confirm" : "sign-in")
  }, [session])

  // Back from signing in again: pick up where the person left off.
  React.useEffect(() => {
    if (!session) return
    const url = new URL(window.location.href)
    if (url.searchParams.get("delete") !== "1") return
    url.searchParams.delete("delete")
    window.history.replaceState(window.history.state, "", url)
    open()
  }, [session, open])

  const remove = async () => {
    if (!matches) return
    setDeleting(true)
    const { error } = await authClient.deleteUser({})
    if (!error) {
      queryClient.clear()
      toast.success("Your account and everything in it were deleted.")
      router.replace("/login")
      return
    }
    setDeleting(false)
    if (error.code === "SESSION_EXPIRED") setStep("sign-in")
    else toast.error(error.message || "Could not delete your account. Try again.")
  }

  const linked = (accounts.data ?? []).filter((account) => providers.some(([provider]) => provider === account.providerId))

  return (
    <>
      <p className="text-sm text-muted-foreground">Bookmarks, notes, drawings, folders and tags are deleted for good. Folders you share are removed for everyone in them. Export your bookmarks first if you want a copy.</p>
      <Button variant="destructive" className="w-fit" disabled={!session} onClick={open}><Trash data-icon="inline-start" />Delete account</Button>
      <Dialog open={step !== "closed"} onOpenChange={(value) => { if (!value && !deleting) setStep("closed") }}>
        <DialogContent className="sm:max-w-md">
          {step === "sign-in" ? (
            <>
              <DialogHeader>
                <DialogTitle>Sign in again to continue</DialogTitle>
                <DialogDescription>For your safety, Cabinet only deletes an account after a recent sign-in. You&apos;ll come back here to finish.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {accounts.isPending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Checking sign-in methods…</p>}
                {linked.map((account) => {
                  const Icon = providers.find(([provider]) => provider === account.providerId)?.[2] ?? GithubLogo
                  return <Button key={account.id} variant="outline" onClick={() => void signInAgain(account.providerId, "&delete=1")}><Icon data-icon="inline-start" />Continue with {providerLabel(account.providerId)}</Button>
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("closed")}>Cancel</Button>
              </DialogFooter>
            </>
          ) : (
            <form className="contents" onSubmit={(event) => { event.preventDefault(); void remove() }}>
              <DialogHeader>
                <DialogTitle>Delete your Cabinet account?</DialogTitle>
                <DialogDescription>This permanently deletes your library: every bookmark, note, drawing, highlight, folder and tag. Folders you share disappear for their members too. This can&apos;t be undone.</DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel htmlFor="delete-account-email">Type your email to confirm</FieldLabel>
                <Input id="delete-account-email" type="email" autoComplete="off" spellCheck={false} placeholder={email} value={typed} onChange={(event) => setTyped(event.target.value)} disabled={deleting} />
                <FieldDescription>{email}</FieldDescription>
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={deleting} onClick={() => setStep("closed")}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={!matches || deleting}>{deleting ? <Spinner /> : <Trash data-icon="inline-start" />}Delete account</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
