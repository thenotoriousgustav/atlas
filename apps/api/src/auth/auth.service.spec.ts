import { ConfigService } from "@nestjs/config"
import { Reflector } from "@nestjs/core"
import { betterAuth } from "better-auth"
import { AuthService } from "./auth.service"
import { AuthGuard } from "./guards/auth.guard"
import { PrismaService } from "@/prisma/prisma.service"

jest.mock("better-auth", () => ({
  betterAuth: jest.fn(() => ({ api: { getSession: jest.fn() } })),
}))
jest.mock("better-auth/adapters/prisma", () => ({ prismaAdapter: jest.fn() }))
jest.mock("better-auth/node", () => ({
  fromNodeHeaders: (headers: HeadersInit) => new Headers(headers),
}))
jest.mock("better-auth/api", () => ({
  APIError: class extends Error {
    constructor(_status: string, body: { message: string }) {
      super(body.message)
    }
  },
}))

function setup() {
  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue({ id: "user-1" }) },
  }
  const service = new AuthService(
    prisma as unknown as PrismaService,
    new ConfigService({
      BETTER_AUTH_SECRET: "a-unique-test-secret-with-at-least-32-characters",
      FRONTEND_URL: "https://app.cabinet.com",
      API_URL: "https://api.cabinet.com",
      COOKIE_DOMAIN: ".cabinet.com",
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
    })
  )
  const options = jest.mocked(betterAuth).mock.calls.at(-1)![0]!
  return { service, prisma, options }
}

describe("Better Auth configuration and session guard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("keeps pure OAuth sign-in and public signup without implicit account linking or passkeys", () => {
    const { options } = setup()
    expect(options.emailAndPassword).toMatchObject({
      enabled: false,
    })
    expect(options.socialProviders).toMatchObject({
      github: { requireEmailVerification: true },
      google: { requireEmailVerification: true },
    })
    expect(options.socialProviders).not.toMatchObject({
      github: { disableSignUp: true },
    })
    expect(options.account?.accountLinking).toMatchObject({
      enabled: true,
      trustedProviders: ["google", "github"],
      requireLocalEmailVerified: false,
      allowDifferentEmails: false,
    })
    expect(options.account?.accountLinking?.disableImplicitLinking).not.toBe(
      true
    )
    expect(options.plugins).toBeUndefined()
    expect(options.trustedOrigins).toEqual([
      "https://app.cabinet.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ])
    expect(options.advanced?.database?.generateId).toBe("uuid")
    expect(options.advanced?.disableOriginCheck).toBe(false)
    expect(options.advanced?.disableCSRFCheck).toBe(false)
  })

  it("rejects unverified OAuth identities for signup, login, and explicit linking", async () => {
    const { options } = setup()
    for (const action of ["create-user", "sign-in", "link-account"] as const) {
      const source = { method: "oauth", action }
      expect(
        await options.user!.validateUserInfo!(
          { user: { emailVerified: false }, source },
          {} as any
        )
      ).toMatchObject({ error: "email_not_verified" })
      expect(
        await options.user!.validateUserInfo!(
          { user: { emailVerified: true }, source },
          {} as any
        )
      ).toBeUndefined()
    }
  })

  it("does not issue sessions to deleted accounts", async () => {
    const { options, prisma } = setup()
    prisma.user.findFirst.mockResolvedValue(null)
    await expect(
      options.databaseHooks!.session!.create!.before!(
        { userId: "deleted" } as any,
        null
      )
    ).rejects.toThrow("Account unavailable")
  })

  it("rejects sessions belonging to deleted accounts", async () => {
    const { service, prisma } = setup()
    jest
      .mocked(service.auth.api.getSession)
      .mockResolvedValue({ user: { id: "deleted" } } as any)
    prisma.user.findFirst.mockResolvedValue(null)
    expect(
      await service.getSession({ cookie: "cabinet.session_token=test" })
    ).toBeNull()
  })

  it("protects API routes with a Better Auth session instead of a JWT", async () => {
    const { service } = setup()
    const reflector = new Reflector()
    const guard = new AuthGuard(service, reflector)
    const request = {
      headers: { cookie: "cabinet.session_token=test" },
      user: undefined,
    }
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => () => {},
      getClass: () => AuthGuard,
    } as any
    jest.mocked(service.auth.api.getSession).mockResolvedValue(null)
    await expect(guard.canActivate(context)).rejects.toThrow(
      "Invalid or expired session"
    )
    const session = { user: { id: "user-1", email: "user@example.com" } }
    jest.mocked(service.auth.api.getSession).mockResolvedValue(session as any)
    expect(await guard.canActivate(context)).toBe(true)
    expect(request.user).toEqual(session.user)
  })
})
