import assert from "node:assert/strict"
import { afterEach, test } from "node:test"
import { AXIOS_INSTANCE, cabinetMediaApi } from "@cabinet/api-client"

const originalAdapter = AXIOS_INSTANCE.defaults.adapter
const originalFetch = globalThis.fetch
afterEach(() => {
  AXIOS_INSTANCE.defaults.adapter = originalAdapter
  globalThis.fetch = originalFetch
})

const response = (config, data = {}) => ({
  config,
  data,
  status: 200,
  statusText: "OK",
  headers: {},
})
const unauthorized = (config) =>
  Object.assign(new Error("Unauthorized"), {
    config,
    response: { status: 401 },
  })

test("shared transport has no browser URL or cookie policy", () => {
  assert.equal(AXIOS_INSTANCE.defaults.baseURL, undefined)
  assert.equal(AXIOS_INSTANCE.defaults.withCredentials, undefined)
  assert.equal(AXIOS_INSTANCE.interceptors.response.handlers.length, 0)
})

test("web adapter uses cookies without refreshing or retrying expired sessions", async () => {
  await import("../src/lib/api-client.ts")
  assert.equal(AXIOS_INSTANCE.defaults.withCredentials, true)
  const requests = []
  AXIOS_INSTANCE.defaults.adapter = async (config) => {
    requests.push(config.url)
    throw unauthorized(config)
  }
  const results = await Promise.allSettled([
    AXIOS_INSTANCE.get("/v1/folders"),
    AXIOS_INSTANCE.get("/v1/tags"),
  ])
  assert.deepEqual(requests, ["/v1/folders", "/v1/tags"])
  assert.ok(results.every((result) => result.status === "rejected"))
})

test("password sign-in uses the Better Auth endpoint and credentials", async () => {
  let requests = 0
  globalThis.fetch = async (url, options) => {
    requests++
    assert.equal(String(url), "http://localhost:4000/v1/auth/sign-in/email")
    assert.equal(options.credentials, "include")
    assert.deepEqual(JSON.parse(options.body), {
      email: "user@example.com",
      password: "wrong-password",
    })
    return new Response(
      JSON.stringify({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
  const { authClient } = await import("../src/lib/auth-client.ts")
  const { error } = await authClient.signIn.email({
    email: "user@example.com",
    password: "wrong-password",
  })
  assert.equal(error.code, "INVALID_EMAIL_OR_PASSWORD")
  assert.equal(requests, 1)
})

test("shared media download returns data without using the DOM", async () => {
  const blob = new Blob(["test media"])
  AXIOS_INSTANCE.defaults.adapter = async (config) => {
    assert.equal(config.responseType, "blob")
    return response(config, blob)
  }
  const result = await cabinetMediaApi.download({
    url: "https://example.com/video",
    mediaType: "VIDEO",
    title: "Video",
  })
  assert.equal(result, blob)
})
