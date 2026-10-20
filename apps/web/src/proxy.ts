import { NextResponse } from "next/server.js"
import type { NextRequest } from "next/server.js"

const BOT_USER_AGENTS =
  /bot|crawler|spider|crawling|whatsapp|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot/i

export function proxy(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || ""
  if (BOT_USER_AGENTS.test(userAgent)) {
    return NextResponse.next()
  }

  const hasSession =
    request.cookies.has("cabinet.session_token") ||
    request.cookies.has("__Secure-cabinet.session_token") ||
    request.cookies.has("session_token")

  if (!hasSession && request.nextUrl.pathname.startsWith("/cabinet")) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/cabinet/:path*"],
}
