import Link from "next/link"
import { LinkBreak } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function SharedCollectionNotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-4xl items-center px-6 py-16">
      <Empty className="border border-border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LinkBreak />
          </EmptyMedia>
          <EmptyTitle>Collection unavailable</EmptyTitle>
          <EmptyDescription>
            This link may have been turned off by the owner, or the collection was removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Go to Cabinet</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
