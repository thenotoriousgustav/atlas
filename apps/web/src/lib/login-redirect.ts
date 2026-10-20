// Only allow the shared-collection return flow; never redirect to a supplied origin.
export function loginReturnPath(search: string) {
  const next = new URLSearchParams(search).get("next")
  return next && /^\/share\/[a-f0-9]{64}$/.test(next) ? next : "/cabinet"
}
