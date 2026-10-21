/**
 * Decide whether a page's response headers forbid embedding it in a third-party iframe.
 * Browsers report a successful iframe load even when they render nothing because of
 * these headers, so the client asks the server before showing a live preview.
 */
export function frameBlockedByHeaders(
  xFrameOptions?: string | null,
  contentSecurityPolicy?: string | null,
): boolean {
  const xfo = xFrameOptions?.trim().toLowerCase()
  if (xfo && (xfo.includes("deny") || xfo.includes("sameorigin"))) return true

  const directive = contentSecurityPolicy
    ?.split(",")
    .flatMap((policy) => policy.split(";"))
    .map((part) => part.trim().toLowerCase())
    .find((part) => part.startsWith("frame-ancestors"))
  if (!directive) return false

  const sources = directive.split(/\s+/).slice(1)
  // Only a wildcard (or a bare scheme) lets an unrelated origin frame the page.
  return !sources.some((source) => source === "*" || source === "https:" || source === "http:")
}
