"use client"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default function SharedCollectionError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl items-center px-6">
      <Empty role="alert" className="w-full border border-border">
        <EmptyHeader>
          <EmptyTitle>Could not load this collection</EmptyTitle>
          <EmptyDescription>The collection could not be reached. Please try again in a moment.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={reset}>Try again</Button>
      </Empty>
    </main>
  )
}
