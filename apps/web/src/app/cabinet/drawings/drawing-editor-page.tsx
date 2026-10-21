"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useQueryClient } from "@tanstack/react-query"
import { Excalidraw, MainMenu, WelcomeScreen, exportToBlob, hashElementsVersion } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { ArrowLeft, FolderSimple } from "@phosphor-icons/react"
import { AXIOS_INSTANCE, useFoldersControllerFindAll } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { NoteAutosave, type NoteSaveStatus } from "@/lib/note-autosave"
import { canAddToFolder } from "@/lib/folder-roles"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { type DrawingScene, emptyScene, keptFiles, sceneKey, storedAppState } from "@/lib/drawing-scene"

type Access = "owner" | "editor" | "viewer"
type Loaded = { title: string; folderId?: string; scene: DrawingScene; access: Access; saved: boolean }
type Snapshot = { title: string; folderId?: string; scene: DrawingScene }

const PREVIEW_SIZE = 640

/** A small WebP of the drawing for library cards, or "" when the canvas is empty. */
async function renderPreview(scene: DrawingScene): Promise<string> {
  const elements = scene.elements.filter((element: any) => !element.isDeleted)
  if (!elements.length) return ""
  const blob = await exportToBlob({
    elements,
    files: scene.files,
    appState: { ...scene.appState, exportBackground: true, exportWithDarkMode: false },
    mimeType: "image/webp",
    quality: 0.8,
    maxWidthOrHeight: PREVIEW_SIZE,
  } as any)
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function DrawingEditorPage({ drawingId }: { drawingId: string }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const userId = session?.user.id

  useEffect(() => {
    if (!isPending && !userId) router.replace("/login")
  }, [isPending, userId, router])

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    setLoaded(null)
    setLoadError(null)
    const params = new URLSearchParams(window.location.search)
    AXIOS_INSTANCE.get(`/v1/bookmarks/${drawingId}`, { signal: controller.signal })
      .then((response) => {
        const item = response.data.data
        if (item.type !== "DRAWING") throw Object.assign(new Error("not a drawing"), { notDrawing: true })
        setLoaded({
          title: item.title ?? "",
          folderId: item.folderId ?? undefined,
          scene: { ...emptyScene(), ...(item.drawing ?? {}) },
          access: item.access ?? "owner",
          saved: true,
        })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error.response?.status === 404 && params.get("new") === "1") {
          setLoaded({ title: "", folderId: params.get("folder") || undefined, scene: emptyScene(), access: "owner", saved: false })
          return
        }
        setLoadError(error.response?.status === 404 || error.notDrawing
          ? "Drawing not found or no longer available."
          : "Could not load this drawing. Check your connection and try again.")
      })
    return () => controller.abort()
  }, [drawingId, userId, retry])

  if (loadError) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-20">
        <p role="alert">{loadError}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/cabinet")}>Back to Cabinet</Button>
          <Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>
        </div>
      </main>
    )
  }
  if (!loaded || !userId) {
    return (
      <div className="flex h-dvh flex-col" role="status" aria-label="Loading drawing">
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 bg-muted/30" />
      </div>
    )
  }
  return <DrawingCanvas drawingId={drawingId} initial={loaded} />
}

function DrawingCanvas({ drawingId, initial }: { drawingId: string; initial: Loaded }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
  const { data: foldersData } = useFoldersControllerFindAll()
  const folders: any[] = (foldersData as any)?.data || []
  const access = initial.access
  const [title, setTitle] = useState(initial.title)
  const [folderId, setFolderId] = useState<string | undefined>(initial.folderId)
  const [status, setStatus] = useState<NoteSaveStatus>("saved")
  const [hasSaved, setHasSaved] = useState(initial.saved)
  const current = useRef<Snapshot>({ title: initial.title, folderId: initial.folderId, scene: initial.scene })
  // Keyed exactly as handleChange keys it, so opening a drawing (or a new, empty one) saves nothing.
  const lastKey = useRef(sceneKey(
    { ...initial.scene, appState: storedAppState(initial.scene.appState) },
    hashElementsVersion(initial.scene.elements),
  ))
  const autosave = useRef<NoteAutosave<Snapshot> | null>(null)

  useEffect(() => {
    let active = true
    const queue = new NoteAutosave<Snapshot>(
      async (snapshot) => {
        const preview = await renderPreview(snapshot.scene).catch(() => undefined)
        await AXIOS_INSTANCE.put(`/v1/bookmarks/${drawingId}/drawing`, {
          title: snapshot.title,
          // null moves the drawing to Unfiled; editors' folder changes are ignored by the server.
          folderId: snapshot.folderId ?? null,
          scene: snapshot.scene,
          ...(preview !== undefined ? { preview } : {}),
        })
        if (!active) return
        setHasSaved(true)
        void queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
        void queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
        void queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
        if (new URLSearchParams(window.location.search).has("new")) {
          window.history.replaceState(window.history.state, "", `/cabinet/drawings/${drawingId}`)
        }
      },
      (value) => { if (active) setStatus(value) },
      1500,
    )
    autosave.current = queue
    const warn = (event: BeforeUnloadEvent) => {
      if (queue.hasUnsavedChanges) { event.preventDefault(); event.returnValue = "" }
    }
    window.addEventListener("beforeunload", warn)
    return () => {
      active = false
      window.removeEventListener("beforeunload", warn)
      queue.dispose()
    }
  }, [drawingId, queryClient])

  const schedule = useCallback((patch: Partial<Snapshot>) => {
    if (access === "viewer") return
    current.current = { ...current.current, ...patch }
    autosave.current?.schedule(current.current)
  }, [access])

  // Excalidraw reports every pointer move; save only when the drawing itself changed.
  const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    const scene: DrawingScene = { elements: [...elements], appState: storedAppState(appState), files: keptFiles(elements, files) }
    const key = sceneKey(scene, hashElementsVersion(elements))
    if (key === lastKey.current) return
    lastKey.current = key
    schedule({ scene })
  }, [schedule])

  const leave = async () => {
    if (await autosave.current?.flush() !== false) {
      router.push(current.current.folderId ? `/cabinet/folders/${encodeURIComponent(current.current.folderId)}` : "/cabinet")
    }
  }

  const initialData = useMemo(() => ({
    elements: initial.scene.elements,
    appState: { ...initial.scene.appState },
    files: initial.scene.files,
    scrollToContent: true,
  }), [initial])

  const currentFolder = folders.find((folder) => folder.id === folderId)
  const statusText = access === "viewer"
    ? "View only"
    : status === "saving" ? "Saving…"
      : status === "unsaved" ? "Unsaved changes"
        : status === "error" ? "Save failed"
          : hasSaved ? "All changes saved" : "Start drawing to save"

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Button variant="ghost" size="sm" onClick={leave} title={currentFolder ? `Back to ${currentFolder.name}` : "Back to Cabinet"}>
          <ArrowLeft data-icon="inline-start" />
          <span className="hidden max-w-32 truncate sm:inline">{currentFolder ? currentFolder.name : "Cabinet"}</span>
        </Button>
        <input
          aria-label="Drawing title"
          placeholder="Untitled drawing"
          value={title}
          readOnly={access === "viewer"}
          maxLength={1000}
          autoFocus={!initial.saved}
          onChange={(event) => { setTitle(event.target.value); schedule({ title: event.target.value }) }}
          // Enter or Esc hands the keyboard back to the canvas, so tool shortcuts work again.
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-base font-medium outline-none placeholder:text-muted-foreground hover:bg-muted/50 focus-visible:bg-muted/50 sm:max-w-md sm:text-sm"
        />
        {access === "owner" && (
          <Select
            value={folderId || "__root__"}
            onValueChange={(value) => {
              const next = value === "__root__" ? undefined : value
              setFolderId(next)
              schedule({ folderId: next })
            }}
          >
            <SelectTrigger size="sm" aria-label="Drawing folder" className="hidden h-8 gap-1.5 border-none bg-transparent text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground sm:flex dark:bg-transparent">
              <FolderSimple className="size-3.5 shrink-0" />
              <SelectValue placeholder="Unfiled" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__root__">Unfiled</SelectItem>
                {folders.filter((folder) => canAddToFolder(folder) || folder.id === folderId).map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground" role="status" aria-live="polite">{statusText}</span>
        {status === "error" && (
          <Button variant="outline" size="sm" onClick={() => void autosave.current?.flush()}>Retry</Button>
        )}
      </header>
      <div className="relative min-h-0 flex-1">
        <Excalidraw
          initialData={initialData}
          onChange={handleChange}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          viewModeEnabled={access === "viewer"}
          name={title || "Untitled drawing"}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
              export: { saveFileToDisk: true },
              saveAsImage: true,
            },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.SearchMenu />
            <MainMenu.DefaultItems.Help />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.Separator />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.HelpHint />
          </WelcomeScreen>
        </Excalidraw>
      </div>
    </main>
  )
}
