// A plain anchor stands in for next/link: the real one is CommonJS, and how Node
// exposes its default export differs between Node versions, which broke CI on Node 22.
import React from "react"

export default function Link({ href, children, prefetch, ...props }) {
  return React.createElement("a", { href: typeof href === "string" ? href : href?.pathname, ...props }, children)
}
