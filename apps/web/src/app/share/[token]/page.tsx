import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowSquareOut, FolderSimple } from "@phosphor-icons/react/ssr"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type SharedBookmark = {
  id: string
  url: string
  title: string
  description: string | null
  imageUrl: string | null
}

type SharedCollection = {
  name: string
  bookmarks: SharedBookmark[]
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

const getSharedCollection = cache(async (token: string): Promise<SharedCollection | null> => {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const response = await fetch(`${apiUrl}/v1/folders/shared/${token}`, {
    cache: "no-store",
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error("Failed to load shared collection")
  const payload = (await response.json()) as { data: SharedCollection }
  return payload.data
})

function safeHttpUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { href: parsed.href, hostname: parsed.hostname.replace(/^www\./, "") }
    }
  } catch {}
  return null
}

function previewUrl(imageUrl: string | null) {
  const safe = imageUrl ? safeHttpUrl(imageUrl) : null
  if (!safe) return null
  return `${apiUrl}/v1/bookmarks/proxy-image?v=2&url=${encodeURIComponent(safe.href)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const collection = await getSharedCollection(token)
  const title = collection ? `${collection.name} — Cabinet` : "Shared collection — Cabinet"
  const description = collection
    ? `${collection.bookmarks.length} saved bookmark${collection.bookmarks.length === 1 ? "" : "s"} shared from Cabinet.`
    : "Shared bookmark collection on Cabinet."

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
  }
}

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const collection = await getSharedCollection(token)
  if (!collection) notFound()

  const items = collection.bookmarks.flatMap((bookmark) => {
    const safe = safeHttpUrl(bookmark.url)
    return safe ? [{ ...bookmark, ...safe, preview: previewUrl(bookmark.imageUrl) }] : []
  })

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-6 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-6">
        <Link href="/" className="font-mono text-sm font-semibold tracking-widest uppercase">
          Cabinet
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          Shared collection · Read only
        </span>
      </header>

      <section className="flex flex-col gap-3 border-b border-border py-10">
        <p className="font-mono text-xs text-muted-foreground uppercase">
          {items.length} bookmark{items.length === 1 ? "" : "s"}
        </p>
        <h1 className="max-w-4xl break-words font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {collection.name}
        </h1>
      </section>

      <section className="flex-1 py-8">
        {items.length === 0 ? (
          <Empty className="border border-border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderSimple />
              </EmptyMedia>
              <EmptyTitle>No bookmarks in this collection</EmptyTitle>
              <EmptyDescription>
                Shared links added directly to this folder will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="flex">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full flex-col justify-between border border-border bg-card transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <div>
                    {item.preview && (
                      <div className="border-b border-border bg-muted/40">
                        <img
                          src={item.preview}
                          alt={item.title || item.hostname}
                          loading="lazy"
                          className="block max-h-56 w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 p-4">
                      <h2 className="break-words text-sm leading-snug font-semibold text-card-foreground group-hover:underline">
                        {item.title || item.href}
                      </h2>
                      {item.description && (
                        <p className="line-clamp-3 break-words text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    <span className="truncate">{item.hostname}</span>
                    <ArrowSquareOut className="size-3.5 shrink-0" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
