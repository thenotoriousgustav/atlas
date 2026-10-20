import * as net from "node:net"
import * as dns from "node:dns/promises"

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number)
    if (
      parts.length !== 4 ||
      parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)
    ) {
      return true
    }
    const [a, b] = parts
    if (a === 0) return true // 0.0.0.0/8
    if (a === 10) return true // 10.0.0.0/8
    if (a === 127) return true // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12 (Docker bridge)
    if (a === 192 && b === 168) return true // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
    if (a >= 224) return true // Multicast & reserved
    return false
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    if (normalized === "::" || normalized === "::1") return true
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice(7))
    }
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true
    if (
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return true
    }
    return false
  }

  return true
}

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "postgres",
  "redis",
  "api",
  "caddy",
  "host.docker.internal",
])

export async function validatePublicUrl(urlString: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error("Invalid URL format")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed")
  }

  const hostname = url.hostname.toLowerCase().trim()
  if (
    !hostname ||
    DISALLOWED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Disallowed host target")
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Private or internal IP addresses are disallowed")
    }
    return url
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true })
    if (!addresses || addresses.length === 0) {
      throw new Error("Hostname resolution returned no addresses")
    }
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error(
          "Hostname resolves to a private or restricted IP address"
        )
      }
    }
  } catch (err: any) {
    if (err.message?.includes("private or restricted")) throw err
    throw new Error(`DNS resolution failed for host: ${hostname}`)
  }

  return url
}
