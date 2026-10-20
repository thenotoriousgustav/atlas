"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GithubLogo, GoogleLogo } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { loginReturnPath } from "@/lib/login-redirect"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session) router.replace(loginReturnPath(window.location.search))
  }, [session, router])

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("error")
    if (
      oauthError === "oauth_unavailable" ||
      oauthError === "provider_not_found"
    ) {
      setError("This sign-in provider is not configured yet.")
    } else if (oauthError === "account_not_linked") {
      setError(
        "This email is already associated with another login provider. Sign in with your existing provider."
      )
    } else if (oauthError) {
      setError(
        "Sign-in failed or was cancelled. Try again with a verified email."
      )
    }
  }, [])

  async function handleSocialSignIn(provider: "github" | "google") {
    if (isSigningIn) return
    setIsSigningIn(true)
    setError(null)
    try {
      const { error: signInError } = await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${loginReturnPath(window.location.search)}`,
        errorCallbackURL: `${window.location.origin}/login?next=${encodeURIComponent(loginReturnPath(window.location.search))}`,
      })
      if (signInError)
        throw new Error(signInError.message || "Sign-in failed. Try again.")
    } catch (failure) {
      const message =
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Try again."
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(
          `Could not connect to the API server (${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}). Please ensure the backend server is running.`
        )
      } else {
        setError(message)
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  if (session) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas text-sm text-brand-muted"
        role="status"
      >
        Redirecting to Cabinet...
      </div>
    )
  }

  return (
    <main className="grid min-h-[100dvh] grid-cols-1 bg-brand-canvas text-brand-charcoal md:grid-cols-12">
      <aside className="hidden flex-col justify-between border-r border-brand-border p-12 md:col-span-5 md:flex">
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
          <span className="size-3 bg-brand-charcoal" aria-hidden="true" />
          Cabinet
        </div>
        <div className="flex max-w-sm flex-col gap-6">
          <h1 className="font-serif text-4xl leading-tight tracking-tight">
            A personal place for what you want to keep.
          </h1>
          <p className="text-sm leading-relaxed text-brand-muted">
            Save useful links, organize notes, and return to your reading
            without losing track.
          </p>
        </div>
        <p className="border-t border-brand-border pt-6 font-mono text-xs text-brand-muted">
          Bookmarks · Notes · Reading
        </p>
      </aside>

      <section className="flex flex-col justify-center px-6 py-12 md:col-span-7 md:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <p className="font-mono text-xs font-bold tracking-widest uppercase md:hidden">
            Cabinet
          </p>
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-3xl tracking-tight">
              Sign in to Cabinet
            </h2>
            <p className="text-sm leading-relaxed text-brand-muted">
              Your bookmarks, notes, and saved reading in one place.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-none"
              disabled={isSigningIn}
              onClick={() => handleSocialSignIn("github")}
            >
              <GithubLogo data-icon="inline-start" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-none"
              disabled={isSigningIn}
              onClick={() => handleSocialSignIn("google")}
            >
              <GoogleLogo data-icon="inline-start" />
              Continue with Google
            </Button>
            <p className="text-xs leading-relaxed text-brand-muted">
              New here? GitHub or Google creates your Cabinet account
              automatically.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
