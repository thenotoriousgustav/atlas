"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { GithubLogo, GoogleLogo, ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (session) router.replace("/cabinet")
  }, [session, router])

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("error")
    if (
      oauthError === "oauth_unavailable" ||
      oauthError === "provider_not_found"
    ) {
      setError(
        "This sign-in provider is not configured yet. Use email and password instead."
      )
    } else if (oauthError === "account_not_linked") {
      setError(
        "This email already has an account. Sign in with your existing method before linking another provider."
      )
    } else if (oauthError) {
      setError(
        "Sign-in failed or was cancelled. Try again with a verified email, or use email and password."
      )
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSigningIn) return
    setIsSigningIn(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      })
      if (signInError)
        throw new Error(
          signInError.message ||
            "Sign-in failed. Check your email and password."
        )
      queryClient.clear()
      router.replace("/cabinet")
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Try again."
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  async function handleSocialSignIn(provider: "github" | "google") {
    if (isSigningIn) return
    setIsSigningIn(true)
    setError(null)
    try {
      const { error: signInError } = await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/cabinet`,
        errorCallbackURL: `${window.location.origin}/login`,
      })
      if (signInError)
        throw new Error(signInError.message || "Sign-in failed. Try again.")
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Try again."
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  if (isPending || session) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas text-sm text-brand-muted"
        role="status"
      >
        Loading session...
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

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="shrink-0 text-xs text-brand-muted">
              Or use email
            </span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 rounded-none"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  required
                  className="h-11 rounded-none"
                />
              </Field>
              <Button
                type="submit"
                disabled={isSigningIn}
                className="h-11 w-full rounded-none"
              >
                {isSigningIn ? "Signing in..." : "Sign in"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </FieldGroup>
          </form>
          <p className="text-xs leading-relaxed text-brand-muted">
            Email sign-in is available for accounts with a password.
          </p>
        </div>
      </section>
    </main>
  )
}
