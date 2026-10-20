import { isPrivateIp, validatePublicUrl } from "./ssrf"
import * as dns from "node:dns/promises"

jest.mock("node:dns/promises")

describe("SSRF Protection - isPrivateIp", () => {
  it.each([
    ["127.0.0.1", true],
    ["127.1.2.3", true],
    ["10.0.0.1", true],
    ["10.255.255.255", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.0.1", true],
    ["192.168.1.100", true],
    ["169.254.169.254", true],
    ["0.0.0.0", true],
    ["::1", true],
    ["::", true],
    ["::ffff:127.0.0.1", true],
    ["::ffff:10.0.0.1", true],
    ["fe80::1", true],
    ["fc00::1", true],
    ["fd00::1", true],
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["142.250.190.46", false],
    ["2606:4700:4700::1111", false],
  ])("correctly classifies IP %s as private: %s", (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected)
  })
})

describe("SSRF Protection - validatePublicUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects non-HTTP protocols", async () => {
    await expect(validatePublicUrl("file:///etc/passwd")).rejects.toThrow(
      "Only HTTP and HTTPS URLs are allowed"
    )
    await expect(validatePublicUrl("ftp://example.com/file")).rejects.toThrow(
      "Only HTTP and HTTPS URLs are allowed"
    )
    await expect(validatePublicUrl("gopher://example.com")).rejects.toThrow(
      "Only HTTP and HTTPS URLs are allowed"
    )
  })

  it("rejects disallowed hostnames and loopbacks", async () => {
    await expect(validatePublicUrl("http://localhost:4000/api")).rejects.toThrow(
      "Disallowed host target"
    )
    await expect(validatePublicUrl("http://test.localhost/api")).rejects.toThrow(
      "Disallowed host target"
    )
    await expect(validatePublicUrl("http://postgres:5432")).rejects.toThrow(
      "Disallowed host target"
    )
    await expect(validatePublicUrl("http://redis:6379")).rejects.toThrow(
      "Disallowed host target"
    )
    await expect(validatePublicUrl("http://127.0.0.1/meta")).rejects.toThrow(
      "Private or internal IP addresses are disallowed"
    )
    await expect(
      validatePublicUrl("http://169.254.169.254/latest/meta-data")
    ).rejects.toThrow("Private or internal IP addresses are disallowed")
  })

  it("rejects hostnames that resolve to private IPs (DNS rebinding / private DNS)", async () => {
    ;(dns.lookup as jest.Mock).mockResolvedValue([
      { address: "127.0.0.1", family: 4 },
    ])

    await expect(
      validatePublicUrl("https://evil-rebind.com/image.jpg")
    ).rejects.toThrow("Hostname resolves to a private or restricted IP address")
  })

  it("accepts valid public hostnames that resolve to public IPs", async () => {
    ;(dns.lookup as jest.Mock).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ])

    const url = await validatePublicUrl("https://example.com/logo.png")
    expect(url.hostname).toBe("example.com")
    expect(url.pathname).toBe("/logo.png")
  })
})
