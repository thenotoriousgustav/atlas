import React from "react"
import { createRoot } from "react-dom/client"
import { SharedCollectionBrowser } from "../../src/app/share/[token]/shared-collection-browser"
import { sharedCollectionItems } from "../../src/lib/shared-collection"

const items = sharedCollectionItems([
  { id: "one", title: "Typography", description: "Font studies and letterforms.", url: "https://type.test/guide", imageUrl: "https://images.test/type.jpg" },
  { id: "two", title: "Color Systems", description: "Design references for digital products.", url: "https://design.test/color", imageUrl: "https://images.test/color.jpg" },
  { id: "three", title: "Camera Archive", description: "Photography and visual culture.", url: "https://camera.test/read", imageUrl: "https://images.test/broken.jpg" },
  { id: "four", title: "Layout Notes", description: "A collection of CSS resources.", url: "https://web.test/layout", imageUrl: null },
], "")

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-6 sm:px-10">
        <header className="flex justify-between border-b border-border py-6"><span className="font-mono text-sm font-semibold tracking-widest uppercase">Cabinet</span><span className="font-mono text-xs text-muted-foreground">Shared collection · Read only</span></header>
        <section className="flex flex-col gap-3 border-b border-border py-10"><p className="font-mono text-xs text-muted-foreground">4 BOOKMARKS</p><h1 className="font-serif text-4xl sm:text-5xl">Visual references</h1></section>
        <SharedCollectionBrowser token={"a".repeat(64)} items={items} />
      </main>
  </React.StrictMode>,
)
