import assert from "node:assert/strict"
import test from "node:test"
import { NextRequest } from "next/server.js"
import { proxy } from "../src/proxy.ts"

test("proxy redirects unauthenticated browser requests on /cabinet to /login", () => {
  const request = new NextRequest("http://localhost:3000/cabinet", {
    headers: { "user-agent": "Mozilla/5.0 Chrome/120.0.0.0" },
  })
  const response = proxy(request)
  assert.equal(response.status, 307)
  assert.equal(new URL(response.headers.get("location")).pathname, "/login")
})

test("proxy allows requests with session cookies to reach /cabinet", () => {
  for (const cookieName of ["cabinet.session_token", "__Secure-cabinet.session_token", "session_token"]) {
    const request = new NextRequest("http://localhost:3000/cabinet", {
      headers: {
        "user-agent": "Mozilla/5.0 Chrome/120.0.0.0",
        cookie: `${cookieName}=valid-token-abc`,
      },
    })
    const response = proxy(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("location"), null)
  }
})

test("proxy allows social media crawlers without cookies to read OpenGraph tags", () => {
  for (const bot of ["WhatsApp/2.24.0", "facebookexternalhit/1.1", "Twitterbot/1.0", "Slackbot 1.0"]) {
    const request = new NextRequest("http://localhost:3000/cabinet", {
      headers: { "user-agent": bot },
    })
    const response = proxy(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("location"), null)
  }
})
