import React from "react"
import { createRoot } from "react-dom/client"
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { BookmarkViewControls } from "../../src/app/cabinet/components/toolbar"
import { useCabinetFilters } from "../../src/app/cabinet/hooks/use-cabinet-filters"
import { BookmarkMoodboardView } from "../../src/app/cabinet/components/bookmark-moodboard-view"
import { FolderTree } from "../../src/app/cabinet/components/folder-tree"
import { Sortable } from "../../src/components/ui/sortable"
import { TooltipProvider } from "../../src/components/ui/tooltip"
import { bookmarkCollisionDetection, masonrySortingStrategy } from "../../src/lib/bookmark-sortable"

const thumbnail = (height: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}"><rect width="320" height="${height}" fill="#ddd"/></svg>`)}`
const initial = Array.from({ length: 24 }, (_, i) => ({
  id: `b${i}`, title: `Bookmark ${i}`, url: `https://example.com/${i}`,
  imageUrl: thumbnail(100 + (i % 3) * 90), faviconUrl: thumbnail(16),
  description: i % 2 ? "A description for this bookmark." : "",
  tags: [], isPinned: false,
}))
const noop = () => {}
const router = { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, hmrRefresh: noop, prefetch: async () => {} } satisfies AppRouterInstance

function Fixture() {
  const [bookmarks, setBookmarks] = React.useState(initial)
  const { sort, handleSortChange } = useCabinetFilters([])
  const [columns, setColumns] = React.useState(3)
  const [trash, setTrash] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>([])
  const [drop, setDrop] = React.useState("")
  const [inspections, setInspections] = React.useState(0)
  return (
    <AppRouterContext.Provider value={router}>
    <TooltipProvider>
      <BookmarkViewControls sort={sort} onSortChange={handleSortChange} viewMode="moodboard" onViewModeChange={noop} />
      <output id="sort">{sort}</output>
      <button onClick={() => { setBookmarks(initial); setDrop(""); setSelected([]) }}>Reset</button>
      <button onClick={() => setColumns((n) => n === 3 ? 2 : 3)}>Columns</button>
      <button onClick={() => setTrash((v) => !v)}>Trash view</button>
      <button onClick={() => setBookmarks((items) => items.slice(1))}>Remove first</button>
      <button onClick={() => setBookmarks((items) => items.map((item, i) => i === 0 ? { ...item, imageUrl: "/late.svg" } : item))}>Resize thumbnail</button>
      <button onClick={() => setBookmarks((items) => [...items, { ...initial[0]!, id: "extra", title: "Extra" }])}>Append</button>
      <output id="order">{bookmarks.map((b) => b.id).join(",")}</output>
      <output id="drop">{drop}</output>
      <output id="inspections">{inspections}</output>
      <Sortable
        value={bookmarks} getItemValue={(b) => b.id} onValueChange={setBookmarks}
        orientation="mixed" strategy={masonrySortingStrategy} collisionDetection={bookmarkCollisionDetection}
        onDragEnd={({ active, over }) => {
          if (over?.data.current?.folderId) {
            setDrop(`${over.data.current.folderId}:${selected.includes(String(active.id)) ? selected.join(",") : active.id}`)
          }
        }}
      >
        <div style={{ display: "flex", gap: 24 }}>
          <aside data-bookmark-sidebar style={{ width: 180, flexShrink: 0 }}>
            <FolderTree folders={[{ id: "design", name: "Design", parentId: null }]} onSelectFolder={noop} onEditFolder={noop} onDeleteFolder={noop} onDropBookmarkToFolder={noop} />
          </aside>
          <main id="panel" style={{ height: 600, overflow: "auto", flex: 1 }}>
            <BookmarkMoodboardView
              sortableInParent bookmarks={bookmarks} activeColumnCount={columns}
              selectedBookmarkIds={selected} isTrashView={trash}
              onToggleSelect={(id) => setSelected((ids) => ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id])}
              onSelectTag={noop} onToggleFavorite={noop} onToggleArchive={noop}
              onEditBookmark={noop} onDeleteBookmark={noop} onDuplicateBookmark={noop}
              onRestoreBookmark={noop} onPermanentDeleteBookmark={noop}
              getHostname={() => "example.com"} getPastelColor={() => ({ bg: "", text: "" })}
              onTogglePin={(bookmark) => setBookmarks((items) => items.map((item) => item.id === bookmark.id ? { ...item, isPinned: !item.isPinned } : item).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)))}
              onReorder={sort === "custom" ? setBookmarks : undefined} onInspectBookmark={() => setInspections((n) => n + 1)}
            />
          </main>
        </div>
      </Sortable>
    </TooltipProvider>
    </AppRouterContext.Provider>
  )
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><Fixture /></React.StrictMode>)
