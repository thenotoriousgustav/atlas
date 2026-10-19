"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

const NoteEditorPage = dynamic(() => import("../note-editor-page"), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-20"
      role="status"
      aria-label="Loading note editor"
    >
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full" />
    </div>
  ),
})

export default function NotePage() {
  const { id } = useParams<{ id: string }>()
  return <NoteEditorPage key={id} noteId={id} />
}
