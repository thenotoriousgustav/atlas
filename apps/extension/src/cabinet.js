// Shared by the popup, the options page and the background worker.
// Talks to the Cabinet API with the browser's existing Cabinet session cookie.

export const DEFAULT_SETTINGS = Object.freeze({
  apiUrl: "http://localhost:4000",
  appUrl: "http://localhost:3000",
})

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS)
  return { apiUrl: trimSlash(stored.apiUrl), appUrl: trimSlash(stored.appUrl) }
}

export function trimSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "")
}

/** Only real web pages can be saved; browser pages, files and data URLs cannot. */
export function saveableUrl(raw) {
  try {
    const url = new URL(raw)
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

/** Same normalization as the web app's duplicate check: no fragment, no trailing slash. */
export function canonicalUrl(raw) {
  const safe = saveableUrl(raw)
  if (!safe) return null
  const url = new URL(safe)
  url.hash = ""
  return url.href.replace(/\/$/, "")
}

export function cleanTags(input) {
  const list = Array.isArray(input) ? input : String(input || "").split(/[,\n]/)
  return [...new Set(list.map((tag) => String(tag).trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0, 20)
}

export class SignedOutError extends Error {
  constructor() {
    super("Sign in to Cabinet to save pages.")
    this.name = "SignedOutError"
  }
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const { apiUrl } = await getSettings()
  let response
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    throw new Error("Cabinet is not reachable. Check the API address in the extension settings.")
  }
  if (response.status === 401) throw new SignedOutError()
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : `Cabinet answered ${response.status}.`
    throw new Error(message)
  }
  // The API wraps every response as { success, data }.
  return payload && "data" in payload ? payload.data : payload
}

export async function getSession() {
  const { apiUrl } = await getSettings()
  try {
    const response = await fetch(`${apiUrl}/v1/auth/get-session`, { credentials: "include" })
    if (!response.ok) return null
    const data = await response.json().catch(() => null)
    return data?.user ? data.user : null
  } catch {
    return null
  }
}

/** Folders the user may add to: their own, or shared as Contributor or Editor. */
export async function listFolders() {
  const folders = (await api("/v1/folders")) || []
  return folders
    .filter((folder) => (folder.access ?? (folder.isOwner === false ? "CONTRIBUTOR" : "OWNER")) !== "VIEWER")
    .map((folder) => ({ id: folder.id, name: folder.name, shared: folder.isOwner === false }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function listTags() {
  const tags = (await api("/v1/tags")) || []
  return tags.map((tag) => tag.name)
}

/** Finds an item already saved at this address, scanning the host's matches page by page. */
export async function findExisting(rawUrl, signal) {
  const canonical = canonicalUrl(rawUrl)
  if (!canonical) return null
  const host = new URL(canonical).hostname
  let cursor
  for (let page = 0; page < 5; page++) {
    const query = new URLSearchParams({ search: host, limit: "100" })
    if (cursor) query.set("cursor", cursor)
    const result = await api(`/v1/bookmarks?${query}`, { signal })
    const match = (result?.data || []).find((item) => item.url && canonicalUrl(item.url) === canonical)
    if (match) return match
    cursor = result?.nextCursor
    if (!cursor) break
  }
  return null
}

export async function saveBookmark({ url, title, folderId, tags, description }) {
  const safe = saveableUrl(url)
  if (!safe) throw new Error("Only web pages (http or https) can be saved.")
  return api("/v1/bookmarks", {
    method: "POST",
    body: {
      type: "BOOKMARK",
      url: safe,
      title: title?.trim() || undefined,
      description: description?.trim() || undefined,
      folderId: folderId || undefined,
      tags: cleanTags(tags),
    },
  })
}

export async function getLastFolderId() {
  const { lastFolderId } = await chrome.storage.local.get({ lastFolderId: "" })
  return lastFolderId
}

export async function setLastFolderId(folderId) {
  await chrome.storage.local.set({ lastFolderId: folderId || "" })
}

export async function openCabinet(path = "/cabinet") {
  const { appUrl } = await getSettings()
  await chrome.tabs.create({ url: `${appUrl}${path}` })
}
