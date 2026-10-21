/** Normalizes a saved HTTP(S) link for a non-blocking duplicate check. */
export function bookmarkUrl(raw: string) {
  const text = raw.trim()
  if (!text || /\s/.test(text)) return null
  try {
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(text)
    const url = new URL(hasScheme ? text : `https://${text}`)
    if (!['http:', 'https:'].includes(url.protocol) || (!hasScheme && !url.hostname.includes('.'))) return null
    url.hash = ''
    return url.href.replace(/\/$/, '')
  } catch { return null }
}
