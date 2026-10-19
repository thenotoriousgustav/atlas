import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { fromNodeHeaders } from "better-auth/node"
import { APIError } from "better-auth/api"
import * as argon2 from "argon2"
import type { IncomingHttpHeaders } from "node:http"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuthService {
  readonly auth: ReturnType<typeof betterAuth>

  constructor(
    private prisma: PrismaService,
    config: ConfigService
  ) {
    const secret = config.getOrThrow<string>("BETTER_AUTH_SECRET")
    if (secret.length < 32)
      throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters")
    const cookieDomain = config.get<string>("COOKIE_DOMAIN")
    const githubClientId = config.get<string>("GITHUB_CLIENT_ID")
    const githubClientSecret = config.get<string>("GITHUB_CLIENT_SECRET")
    const googleClientId = config.get<string>("GOOGLE_CLIENT_ID")
    const googleClientSecret = config.get<string>("GOOGLE_CLIENT_SECRET")

    const options: BetterAuthOptions = {
      appName: "Cabinet",
      secret,
      baseURL: config.get<string>("API_URL") || "http://localhost:4000",
      basePath: "/v1/auth",
      trustedOrigins: [
        config.get<string>("FRONTEND_URL") || "http://localhost:3000",
      ],
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      user: {
        fields: { image: "avatar" },
        validateUserInfo: ({ user, source }) => {
          if (source.method === "oauth" && user.emailVerified !== true) {
            return {
              error: "email_not_verified",
              errorDescription: "A verified provider email is required",
            }
          }
        },
      },
      emailAndPassword: {
        enabled: true,
        disableSignUp: true,
        password: {
          hash: (password) => argon2.hash(password),
          verify: ({ hash, password }) => argon2.verify(hash, password),
        },
      },
      socialProviders: {
        ...(githubClientId && githubClientSecret
          ? {
              github: {
                clientId: githubClientId,
                clientSecret: githubClientSecret,
                requireEmailVerification: true,
              },
            }
          : {}),
        ...(googleClientId && googleClientSecret
          ? {
              google: {
                clientId: googleClientId,
                clientSecret: googleClientSecret,
                requireEmailVerification: true,
              },
            }
          : {}),
      },
      account: {
        accountLinking: {
          enabled: true,
          trustedProviders: ["google", "github"],
          requireLocalEmailVerified: false,
          allowDifferentEmails: false,
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      advanced: {
        disableOriginCheck: false,
        disableCSRFCheck: false,
        database: { generateId: "uuid" },
        cookiePrefix: "cabinet",
        ...(cookieDomain && cookieDomain !== "localhost"
          ? {
              crossSubDomainCookies: { enabled: true, domain: cookieDomain },
            }
          : {}),
      },
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              const user = await prisma.user.findFirst({
                where: { id: session.userId, deletedAt: null },
                select: { id: true },
              })
              if (!user)
                throw new APIError("UNAUTHORIZED", {
                  message: "Account unavailable",
                })
            },
          },
        },
      },
    }
    this.auth = betterAuth(options)
  }

  async getSession(headers: IncomingHttpHeaders) {
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(headers),
    })
    if (!session) return null
    const user = await this.prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: { id: true },
    })
    return user ? session : null
  }
}
