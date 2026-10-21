import { frameBlockedByHeaders } from "./embed-policy"

describe("frameBlockedByHeaders", () => {
  it("allows pages without framing headers", () => {
    expect(frameBlockedByHeaders(null, null)).toBe(false)
    expect(frameBlockedByHeaders(undefined, "default-src 'self'")).toBe(false)
  })

  it("blocks X-Frame-Options DENY and SAMEORIGIN", () => {
    expect(frameBlockedByHeaders("DENY", null)).toBe(true)
    expect(frameBlockedByHeaders("SameOrigin", null)).toBe(true)
  })

  it("blocks restrictive frame-ancestors", () => {
    expect(frameBlockedByHeaders(null, "frame-ancestors 'none'")).toBe(true)
    expect(frameBlockedByHeaders(null, "default-src *; frame-ancestors 'self' https://example.com")).toBe(true)
  })

  it("allows wildcard frame-ancestors", () => {
    expect(frameBlockedByHeaders(null, "frame-ancestors *")).toBe(false)
    expect(frameBlockedByHeaders(null, "frame-ancestors https:")).toBe(false)
  })
})
