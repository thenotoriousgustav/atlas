"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@atlas/ui/components/button"
import { Input } from "@atlas/ui/components/input"
import { Label } from "@atlas/ui/components/label"
import { cn } from "@/lib/utils"
import { useAuthControllerLogin, useAuthControllerMe } from "@atlas/api-client"
import { useAuthStore } from "../../store/useAuthStore"
import { startAuthentication } from "@simplewebauthn/browser"
import {
  Fingerprint,
  Clock,
  ShieldCheck,
  Key,
  ArrowRight,
} from "@phosphor-icons/react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPasskeyAuthenticating, setIsPasskeyAuthenticating] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [isTwoStep, setIsTwoStep] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Check if user is already logged in, redirect to home page
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  })

  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data)
        router.push("/")
      } else {
        setIsPageLoading(false)
      }
    }
  }, [meData, isMeLoading, setUser, router])

  // Live dynamic clock logic
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  const loginMutation = useAuthControllerLogin()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null)
      try {
        const response = await loginMutation.mutateAsync({
          data: value,
        })

        const res = response as any
        if (res?.success) {
          if (res?.data?.requirePasskey2FA) {
            setIsTwoStep(true)
          } else if (res?.data?.user) {
            queryClient.clear()
            setUser(res.data.user)
            router.push("/")
          }
        } else {
          setErrorMsg("Authentication failed. Check your credentials.")
        }
      } catch (err: any) {
        const backendMessage =
          err?.response?.data?.message || err?.message || "Login failed"
        setErrorMsg(backendMessage)
      }
    },
  })

  const handlePasskeyLogin = async () => {
    const email = form.getFieldValue("email")
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter your registered email address first.")
      return
    }

    setErrorMsg(null)
    setIsPasskeyAuthenticating(true)

    try {
      // 1. Get authentication options
      const optionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/passkey/login-options?email=${encodeURIComponent(email)}`,
        {
          credentials: "include",
        }
      )

      if (!optionsRes.ok) {
        throw new Error(
          "Failed to load passkey login options. Make sure the email is registered."
        )
      }

      const options = await optionsRes.json()

      // 2. Trigger browser biometrics
      const assertionJSON = await startAuthentication({
        optionsJSON: options.data,
      })

      // 3. Post verification payload
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/passkey/login-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            response: assertionJSON,
          }),
        }
      )

      if (!verifyRes.ok) {
        throw new Error("Passkey login verification failed")
      }

      const verifyData = await verifyRes.json()
      if (verifyData?.success && verifyData?.data?.user) {
        queryClient.clear()
        setUser(verifyData.data.user)
        router.push("/")
      } else {
        throw new Error("Invalid authentication response")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Passkey authentication failed")
    } finally {
      setIsPasskeyAuthenticating(false)
    }
  }

  // Automatically trigger passkey dialog once we enter 2FA step
  useEffect(() => {
    if (isTwoStep) {
      handlePasskeyLogin()
    }
  }, [isTwoStep])

  if (isPageLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas font-mono text-[10px] tracking-widest text-brand-muted uppercase">
        <span>Loading session coordinates...</span>
      </div>
    )
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 bg-brand-canvas font-mono select-none md:grid-cols-12">
      {/* Left side: Editorial brand layout & manifesto (5 cols) */}
      <div className="hidden flex-col justify-between border-r border-brand-border bg-brand-canvas p-12 text-brand-charcoal md:col-span-5 md:flex">
        {/* Logo and Dynamic Clock */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-brand-charcoal" />
            <h1 className="text-xs font-bold tracking-widest text-brand-charcoal uppercase">
              Atlas Platform
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 border border-brand-border bg-brand-canvas px-3 py-1 text-[10px] font-bold text-brand-muted">
            <Clock className="h-3.5 w-3.5 text-brand-charcoal" />
            <span>UTC/LOCAL · {currentTime || "--:--:--"}</span>
          </div>
        </div>

        {/* Brand Manifesto Statement */}
        <div className="my-auto max-w-sm space-y-6">
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-brand-charcoal italic">
            A unified suite built to coordinate life, habits, vehicles, and
            media without overhead.
          </h2>
          <p className="text-[11px] leading-relaxed text-brand-muted">
            Atlas streamlines workspace orchestration by linking bookmarks,
            habit logs, vehicle sheets, and download collections into a single,
            offline-first portal.
          </p>
        </div>

        {/* Security Specs Monospace Footer */}
        <div className="space-y-3 border-t border-brand-border pt-6">
          <span className="block text-[9px] font-bold tracking-wider text-brand-muted uppercase">
            System Protocols
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-brand-muted">
              <ShieldCheck className="h-4 w-4 text-brand-charcoal" />
              <span>HTTP-only Secure Cookies active</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-brand-muted">
              <Key className="h-4 w-4 text-brand-charcoal" />
              <span>WebAuthn Passkey integration ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Modern high-contrast input interface (7 cols) */}
      <div className="col-span-1 flex min-h-[100dvh] flex-col justify-between bg-brand-canvas p-8 md:col-span-7 md:p-16">
        {/* Mobile Header (Hidden on desktop) */}
        <div className="mb-8 flex items-center justify-between border-b border-brand-border pb-6 md:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-brand-charcoal" />
            <h1 className="text-xs font-bold tracking-widest text-brand-charcoal uppercase">
              Atlas
            </h1>
          </div>
          {currentTime && (
            <span className="text-[10px] font-bold text-brand-muted">
              {currentTime}
            </span>
          )}
        </div>

        {/* Empty top slot to push form container vertically center */}
        <div className="hidden md:block" />

        {/* Form Box Container */}
        <div className="mx-auto w-full max-w-md space-y-8">
          {isTwoStep ? (
            /* Two-Step Passkey Verification Screen */
            <div className="animate-fadeIn space-y-8">
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-medium tracking-tight text-brand-charcoal">
                  Two-Step Verification
                </h3>
                <p className="text-xs leading-relaxed text-brand-muted">
                  Your primary credentials match. Please verify your identity
                  using your registered Passkey (biometrics) to access the
                  platform.
                </p>
              </div>

              {errorMsg && (
                <div className="animate-fadeIn rounded-none border border-[#9F2F2D]/20 bg-[#FDEBEC] px-4 py-3 text-xs font-bold text-[#9F2F2D]">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyAuthenticating}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-brand-border bg-brand-charcoal text-xs font-bold tracking-wider text-brand-canvas uppercase transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Fingerprint className="h-4 w-4 text-brand-canvas" />
                  <span>
                    {isPasskeyAuthenticating
                      ? "Scanning..."
                      : "Verify with Passkey"}
                  </span>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setIsTwoStep(false)
                    setErrorMsg(null)
                  }}
                  disabled={isPasskeyAuthenticating}
                  variant="outline"
                  className="flex h-11 w-full items-center justify-center rounded-none border border-brand-border text-xs font-bold tracking-wider text-brand-muted uppercase transition-all hover:bg-brand-charcoal/5 active:scale-[0.98]"
                >
                  <span>Back to Credentials</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Login Form */
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-medium tracking-tight text-brand-charcoal">
                  Authenticate
                </h3>
                <p className="text-xs text-brand-muted">
                  Please fill in your coordinates to open your productivity
                  workspace.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-5"
              >
                {errorMsg && (
                  <div className="animate-fadeIn rounded-none border border-[#9F2F2D]/20 bg-[#FDEBEC] px-4 py-3 text-xs font-bold text-[#9F2F2D]">
                    {errorMsg}
                  </div>
                )}

                {/* Email Field */}
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      const result = loginSchema.shape.email.safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0]?.message
                    },
                  }}
                  children={(field) => {
                    const hasError = field.state.meta.errors.length > 0
                    return (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="email"
                          className="text-[9px] font-bold tracking-wider text-brand-muted uppercase"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="email"
                          autoComplete="email"
                          placeholder="admin@gustam.dev"
                          className={cn(
                            "h-11 rounded-none border bg-brand-canvas px-3 font-mono text-xs text-brand-charcoal transition-colors placeholder:text-brand-muted/50 focus-visible:border-brand-charcoal focus-visible:ring-0 focus-visible:outline-none",
                            hasError
                              ? "border-[#9F2F2D]"
                              : "border-brand-border"
                          )}
                        />
                        {hasError && (
                          <p className="text-[10px] font-bold tracking-wide text-[#9F2F2D] uppercase">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                {/* Password Field */}
                <form.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => {
                      const result = loginSchema.shape.password.safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0]?.message
                    },
                  }}
                  children={(field) => {
                    const hasError = field.state.meta.errors.length > 0
                    return (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="password"
                          className="text-[9px] font-bold tracking-wider text-brand-muted uppercase"
                        >
                          Security Keyphrase
                        </Label>
                        <Input
                          id="password"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className={cn(
                            "h-11 rounded-none border bg-brand-canvas px-3 font-mono text-xs text-brand-charcoal transition-colors placeholder:text-brand-muted/50 focus-visible:border-brand-charcoal focus-visible:ring-0 focus-visible:outline-none",
                            hasError
                              ? "border-[#9F2F2D]"
                              : "border-brand-border"
                          )}
                        />
                        {hasError && (
                          <p className="text-[10px] font-bold tracking-wide text-[#9F2F2D] uppercase">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                {/* Form Actions Grid */}
                <div className="space-y-3 pt-3">
                  <form.Subscribe selector={(state) => [state.isSubmitting]}>
                    {([isSubmitting]) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting || isPasskeyAuthenticating}
                        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-none border border-brand-border bg-brand-charcoal text-xs font-bold tracking-wider text-brand-canvas uppercase transition-all hover:opacity-90 active:scale-[0.98]"
                      >
                        <span>
                          {isSubmitting
                            ? "Authenticating..."
                            : "Submit Credentials"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Micro-UX footer security indicators */}
        <div className="border-t border-brand-border pt-12 text-center md:text-left">
          <p className="font-mono text-[9px] tracking-wider text-brand-muted uppercase">
            Protected by HttpOnly Session Cookies · SameSite Lax · WebAuthn v2
          </p>
        </div>
      </div>
    </div>
  )
}
