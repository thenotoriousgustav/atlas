import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { build } from "esbuild"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

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

const render = (url) => renderToStaticMarkup(React.createElement(BookmarkWebview, {
  bookmark: { id: "preview", title: "Example", url }, onClose() {},
}))

test("webview embeds HTTP websites with sandbox and an explicit external fallback", () => {
  const html = render("https://example.com/article")
  assert.match(html, /<iframe[^>]+src="https:\/\/example.com\/article"/)
  assert.match(html, /sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"/)
  assert.match(html, /referrerPolicy="no-referrer"/)
  assert.doesNotMatch(html, /allow-top-navigation/)
  assert.match(html, /Open original/)
  assert.match(html, /Some websites block embedded previews/)
  assert.match(html, /Loading website/)
  assert.match(html, /Bookmark navigation/)
})

test("webview rejects executable, local-file, and malformed URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd", "invalid"]) {
    const html = render(url)
    assert.doesNotMatch(html, /<iframe/)
    assert.match(html, /Only valid HTTP and HTTPS/)
  }
})
