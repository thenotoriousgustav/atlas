import type { JSONContent } from "@tiptap/core"
import type { NoteSnapshot } from "./note-autosave"

export function legacyNoteToDocument(text: string): JSONContent {
  return {
    type: "doc",
    content: text.split(/\r?\n/).map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  }
}

export function parseNoteDraft(value: string | null): NoteSnapshot | null {
  if (!value) return null
  try {
    const draft = JSON.parse(value)
    return typeof draft.title === "string" &&
      typeof draft.notes === "string" &&
      draft.noteDocument?.type === "doc" &&
      Array.isArray(draft.noteDocument.content)
      ? draft
      : null
  } catch {
    return null
  }
}
