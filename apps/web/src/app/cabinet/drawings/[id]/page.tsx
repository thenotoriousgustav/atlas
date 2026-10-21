"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

// Excalidraw touches the browser on import, so the editor only loads on the client.
const DrawingEditorPage = dynamic(() => import("../drawing-editor-page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh flex-col" role="status" aria-label="Loading drawing">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex-1 bg-muted/30" />
    </div>
  ),
})

export default function DrawingPage() {
  const { id } = useParams<{ id: string }>()
  return <DrawingEditorPage key={id} drawingId={id} />
}
