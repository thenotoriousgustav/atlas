import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { build } from "esbuild"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Render the preview without the portal; production keeps the real Radix dialog.
const directory = await mkdtemp(join(process.cwd(), ".webview-test-"))
let BookmarkWebview
try {
  const result = await build({
    entryPoints: ["src/app/cabinet/components/bookmark-webview.tsx"],
    bundle: true,
    jsx: "automatic",
    platform: "node",
    format: "esm",
    packages: "external",
    external: ["react"],
    write: false,
    plugins: [{
      name: "dialog-without-portal",
      setup(builder) {
        builder.onResolve({ filter: /^@\/components\/ui\/(dialog|button)$/ }, ({ path }) => ({ path, namespace: "test-ui" }))
        builder.onLoad({ filter: /.*/, namespace: "test-ui" }, () => ({
          contents: `import React from 'react';
            export const Dialog = ({children}) => children;
            export const DialogContent = ({children}) => React.createElement('section', null, children);
            export const DialogClose = ({children}) => children;
            export const DialogTitle = ({children}) => React.createElement('h2', null, children);
            export const DialogDescription = ({children}) => React.createElement('p', null, children);
            export const Button = ({children}) => children;`,
          loader: "js",
        }))
      },
    }],
  })
  const file = join(directory, "preview.mjs")
  await writeFile(file, result.outputFiles[0].text)
  ;({ BookmarkWebview } = await import(pathToFileURL(file).href))
} finally {
  await rm(directory, { recursive: true, force: true })
}

// Seed the embeddability answer the server would give for this URL.
const render = (url, embeddable, extra = {}) => {
  const client = new QueryClient()
  if (embeddable !== undefined) client.setQueryData(["/v1/bookmarks/embeddable", new URL(url).href], embeddable)
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(BookmarkWebview, { bookmark: { id: "preview", title: "Example", url, ...extra }, onClose() {} })))
}

test("webview embeds websites that allow framing, with sandbox and an external fallback", () => {
  const html = render("https://example.com/article", true)
  assert.match(html, /<iframe[^>]+src="https:\/\/example.com\/article"/)
  assert.match(html, /sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"/)
  assert.match(html, /referrerPolicy="no-referrer"/)
  assert.doesNotMatch(html, /allow-top-navigation/)
  assert.match(html, /Open original/)
  assert.match(html, /Loading website/)
  assert.match(html, /Bookmark navigation/)
})

test("webview shows saved details instead of a blank frame for sites that forbid framing", () => {
  const html = render("https://github.com/", false)
  assert.doesNotMatch(html, /<iframe/)
  assert.match(html, /does not allow previews inside other apps/)
  assert.match(html, /Open original/)
})

test("saved details show the preview thumbnail through the image proxy", () => {
  const html = render("https://www.threads.com/@a/post/1", false, { imageUrl: "https://cdn.example.com/a.jpg" })
  assert.match(html, /<img[^>]+src="[^"]*proxy-image\?v=2&amp;url=https%3A%2F%2Fcdn.example.com%2Fa.jpg"/)
})

test("webview waits for the framing check before loading the site", () => {
  const html = render("https://example.com/article")
  assert.doesNotMatch(html, /<iframe/)
  assert.match(html, /Preparing preview/)
})

test("webview rejects executable, local-file, and malformed URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd", "invalid"]) {
    const client = new QueryClient()
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(BookmarkWebview, { bookmark: { id: "preview", title: "Example", url }, onClose() {} })))
    assert.doesNotMatch(html, /<iframe/)
    assert.match(html, /Only valid HTTP and HTTPS/)
  }
})
