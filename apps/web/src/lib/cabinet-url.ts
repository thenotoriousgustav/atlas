// Cabinet location <-> filters. Primary location lives in the path
// (/cabinet/favorites, /cabinet/folders/<id>, /cabinet/tags/<name>);
// secondary refinements stay in the query (?tag, ?format, ?q, ?sort).
export const cabinetViews = ["favorites", "archive", "trash", "broken", "duplicates"] as const
export type CabinetView = (typeof cabinetViews)[number]
export type CabinetFormat = "all" | "links" | "notes" | "media"

export interface CabinetLocation {
  folderId?: string
  tag?: string
  view?: CabinetView
  format?: CabinetFormat
  q?: string
  sort?: string
}

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const formats = ["all", "links", "notes", "media"]
const isView = (value: unknown): value is CabinetView => cabinetViews.includes(value as CabinetView)
const cleanTag = (tag?: string | null) => tag?.trim().replace(/^#/, "") || undefined
const decode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function parseCabinetLocation(pathname: string, search: string): CabinetLocation {
  const params = new URLSearchParams(search)
  const [, , kind, value] = pathname.replace(/\/+$/, "").split("/")
  const legacyView = params.get("view")
  const format = params.get("format") ||
    (legacyView === "notes" ? "notes" : legacyView === "bookmarks" ? "links" : legacyView === "media" ? "media" : null)
  const folder = kind === "folders" ? decode(value ?? "") : params.get("folder")
  const view = isView(kind) ? kind : isView(legacyView) ? legacyView : undefined

  return {
    folderId: folder && UUID.test(folder) ? folder : undefined,
    tag: cleanTag(kind === "tags" && value ? decode(value) : params.get("tag")),
    view,
    format: formats.includes(format ?? "") ? (format as CabinetFormat) : undefined,
    q: params.get("q") || undefined,
    sort: params.get("sort") || undefined,
  }
}

export function buildCabinetUrl({ folderId, tag, view, format, q, sort }: CabinetLocation) {
  let path = "/cabinet"
  let queryTag = tag
  if (folderId) path += `/folders/${folderId}`
  else if (view) path += `/${view}`
  else if (tag) {
    path += `/tags/${encodeURIComponent(tag)}`
    queryTag = undefined
  }

  const params = new URLSearchParams()
  if (queryTag) params.set("tag", queryTag)
  if (format && format !== "all") params.set("format", format)
  if (q?.trim()) params.set("q", q.trim())
  if (sort && sort !== "custom") params.set("sort", sort)
  const qs = params.toString()
  return { path, url: qs ? `${path}?${qs}` : path }
}
