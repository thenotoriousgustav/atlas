"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useEditor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { ArrowLeft, Image, Table as TableIcon, FolderSimple } from "@phosphor-icons/react"
import {
  BlockEditor,
  SlashCommand,
  CodeBlock,
  defaultSlashCommandItems,
  getSlashCommandSuggestion,
  type SlashCommandSuggestionItem,
} from "@/components/block-editor"
import { Table } from "@/components/extensions/table"
import { TableHoverOverlay } from "@/components/extensions/table/table-hover-overlay"
import {
  ImagePlaceholder,
  ResizableImage,
} from "@/components/extensions/image-placeholder"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth-client"
import { AXIOS_INSTANCE, useFoldersControllerFindAll } from "@/lib/api-client"
import {
  NoteAutosave,
  type NoteSnapshot,
  type NoteSaveStatus,
} from "@/lib/note-autosave"
import { legacyNoteToDocument, parseNoteDraft } from "@/lib/note-document"
import "@/components/block-editor/style.css"
import "@/components/extensions/table/style.css"
import "@/components/extensions/image-placeholder/style.css"
import "@/components/extensions/ui/style.css"

const slashItems: SlashCommandSuggestionItem[] = [
  ...defaultSlashCommandItems,
  {
    id: "image",
    title: "Image",
    description: "Embed an image from a URL.",
    keywords: ["image", "photo", "picture"],
    icon: <Image />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertImagePlaceholder().run()
    },
  },
  {
    id: "table",
    title: "Table",
    description: "Insert a resizable table.",
    keywords: ["table", "grid"],
    icon: <TableIcon />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
]

function readDraft(key: string) {
  try {
    return parseNoteDraft(localStorage.getItem(key))
  } catch {
    return null
  }
}

export default function NoteEditorPage({ noteId }: { noteId: string }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [loaded, setLoaded] = useState<NoteSnapshot | null>(null)
  const [draft, setDraft] = useState<NoteSnapshot | null>(null)
  const [restored, setRestored] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const userId = session?.user.id
  const draftKey = `cabinet:note-draft:v1:${userId}:${noteId}`

  useEffect(() => {
    if (!isPending && !userId) router.replace("/login")
  }, [isPending, userId, router])

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    setLoaded(null)
    setDraft(null)
    setLoadError(null)
    const load = async () => {
      try {
        let note: any
        try {
          const response = await AXIOS_INSTANCE.get(`/v1/bookmarks/${noteId}`, {
            signal: controller.signal,
          })
          note = response.data.data
          if (note.type !== "NOTE") throw new Error("This item is not a note.")
        } catch (error: any) {
          const isNew =
            new URLSearchParams(window.location.search).get("new") === "1"
          if (error.response?.status !== 404 || !isNew) throw error
        }
        if (controller.signal.aborted) return
        const saved: NoteSnapshot = {
          folderId:
            note?.folderId ||
            new URLSearchParams(window.location.search).get("folder") ||
            undefined,
          title: note?.title ?? "",
          notes: note?.notes || note?.description || "",
          noteDocument:
            note?.noteDocument ??
            legacyNoteToDocument(note?.notes || note?.description || ""),
        }
        const local = readDraft(draftKey)
        // A server-backed note requires an explicit choice before an old draft can overwrite it.
        setIsNew(!note)
        setDraft(note ? local : null)
        setRestored(!note && !!local)
        setLoaded(!note && local ? local : saved)
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoadError(
            error.response?.status === 404
              ? "Note not found or no longer available."
              : "Could not load this note. Your local draft has not been deleted."
          )
        }
      }
    }
    void load()
    return () => controller.abort()
  }, [noteId, userId, draftKey, retry])

  if (loadError)
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-20">
        <p role="alert">{loadError}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/cabinet")}>
            Back to Cabinet
          </Button>
          <Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>
        </div>
      </main>
    )
  if (!loaded || !userId)
    return (
      <main
        className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-20"
        role="status"
        aria-label="Loading note"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </main>
    )

  return (
    <NoteCanvas
      key={`${userId}:${noteId}:${restored}`}
      noteId={noteId}
      draftKey={draftKey}
      initial={loaded}
      initiallySaved={!isNew}
      recovered={restored}
      draft={draft}
      onRestore={() => {
        setLoaded(draft)
        setDraft(null)
        setRestored(true)
      }}
      onDiscardDraft={() => {
        try {
          localStorage.removeItem(draftKey)
        } catch {}
        setDraft(null)
      }}
    />
  )
}

function NoteCanvas({
  noteId,
  draftKey,
  initial,
  initiallySaved,
  recovered,
  draft,
  onRestore,
  onDiscardDraft,
}: {
  noteId: string
  draftKey: string
  initial: NoteSnapshot
  initiallySaved: boolean
  recovered: boolean
  draft: NoteSnapshot | null
  onRestore: () => void
  onDiscardDraft: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: foldersData } = useFoldersControllerFindAll()
  const folders = (foldersData as any)?.data || foldersData || []
  const [title, setTitle] = useState(initial.title)
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(initial.folderId)
  const [hasSaved, setHasSaved] = useState(initiallySaved)
  const [status, setStatus] = useState<NoteSaveStatus>(
    recovered ? "unsaved" : "saved"
  )
  const [backupUnavailable, setBackupUnavailable] = useState(false)
  const current = useRef(initial)
  const autosave = useRef<NoteAutosave | null>(null)

  useEffect(() => {
    let active = true
    const queue = new NoteAutosave(
      async (snapshot) => {
        await AXIOS_INSTANCE.put(`/v1/bookmarks/${noteId}/note`, snapshot)
        if (current.current === snapshot) {
          try {
            localStorage.removeItem(draftKey)
          } catch {}
        }
        if (active) {
          setHasSaved(true)
          queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
          queryClient.invalidateQueries({
            queryKey: ["infinite", "/v1/bookmarks"],
          })
          queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/health"] })
          queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
          if (new URLSearchParams(window.location.search).has("new")) {
            window.history.replaceState(
              window.history.state,
              "",
              `/cabinet/notes/${noteId}`
            )
          }
        }
      },
      (value) => {
        if (active) setStatus(value)
      }
    )
    autosave.current = queue
    if (recovered) queue.schedule(current.current)
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (queue.hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", warnBeforeLeaving)
    return () => {
      active = false
      queue.dispose()
      window.removeEventListener("beforeunload", warnBeforeLeaving)
    }
  }, [noteId, draftKey, recovered, queryClient])

  const update = (snapshot: NoteSnapshot) => {
    current.current = snapshot
    try {
      localStorage.setItem(draftKey, JSON.stringify(snapshot))
      setBackupUnavailable(false)
    } catch {
      setBackupUnavailable(true)
    }
    autosave.current?.schedule(snapshot)
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        underline: false,
        link: false,
        gapcursor: false,
      }),
      Placeholder.configure({ placeholder: "Type / for commands..." }),
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      ResizableImage,
      ImagePlaceholder.configure({ allowUpload: false }),
      SlashCommand.configure({
        suggestion: getSlashCommandSuggestion(slashItems),
      }),
      CodeBlock,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editable: !draft,
    content: initial.noteDocument as JSONContent,
    onUpdate: ({ editor }) =>
      update({
        ...current.current,
        notes: editor.getText({ blockSeparator: "\n" }),
        noteDocument: editor.getJSON(),
      }),
  })

  useEffect(() => {
    editor?.setEditable(!draft, false)
  }, [editor, draft])

  const leave = async () => {
    if (await autosave.current?.flush()) {
      if (current.current.folderId) {
        router.push(`/cabinet?folder=${encodeURIComponent(current.current.folderId)}`)
      } else {
        router.push("/cabinet")
      }
    }
  }

  const currentFolder = folders.find((f: any) => f.id === selectedFolderId)

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={leave} title={currentFolder ? `Back to ${currentFolder.name}` : "Back to Cabinet"}>
            <ArrowLeft data-icon="inline-start" />
            <span className="max-w-32 truncate sm:max-w-xs">{currentFolder ? currentFolder.name : "Cabinet"}</span>
          </Button>

          <Select
            value={selectedFolderId || "__root__"}
            onValueChange={(val) => {
              const next = val === "__root__" ? undefined : val
              setSelectedFolderId(next)
              update({ ...current.current, folderId: next })
            }}
          >
            <SelectTrigger size="sm" aria-label="Note folder" className="h-8 gap-1.5 border-none bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <FolderSimple className="size-3.5 shrink-0" />
              <SelectValue placeholder="Unfiled" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__root__">Unfiled (Root)</SelectItem>
                {folders.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {status === "saving"
              ? "Saving..."
              : status === "unsaved"
                ? "Unsaved changes"
                : status === "error"
                  ? "Save failed"
                  : hasSaved
                    ? "All changes saved"
                    : "Start writing to save"}
          </span>
          {status === "error" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void autosave.current?.flush()}
            >
              Retry save
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 sm:px-12 sm:pt-20">
        {draft && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-4 text-sm"
          >
            <p>An unsaved local draft is available.</p>
            <Button variant="outline" size="sm" onClick={onRestore}>
              Restore draft
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscardDraft}>
              Keep saved note
            </Button>
          </div>
        )}
        {status === "error" && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            Your changes could not be saved. Keep this page open and retry.
          </p>
        )}
        {backupUnavailable && status !== "saved" && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            Browser draft backup is unavailable. Keep this page open until your
            changes are saved.
          </p>
        )}
        <input
          aria-label="Note title"
          placeholder="Untitled"
          autoFocus={!initiallySaved}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              editor?.commands.focus("start")
            }
          }}
          maxLength={1000}
          value={title}
          disabled={!!draft}
          onChange={(event) => {
            setTitle(event.target.value)
            update({ ...current.current, title: event.target.value })
          }}
          className="mb-8 w-full border-0 bg-transparent p-0 pl-8 text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring/50 sm:text-4xl"
        />
        <BlockEditor editor={editor} />
        <TableHoverOverlay editor={editor} />
      </div>
    </main>
  )
}
