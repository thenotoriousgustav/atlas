import Link from "next/link"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between border-b border-brand-border py-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-widest uppercase"
        >
          Cabinet
        </Link>
        <Link
          href="/login"
          className="text-sm text-brand-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Sign in
        </Link>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-8 py-16 sm:py-24">
        <h1 className="max-w-3xl font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
          A place for what you want to keep.
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-brand-muted sm:text-lg">
          Save bookmarks, organize notes, and return to your reading. Your
          personal library, without the clutter.
        </p>
        <Link
          href="/cabinet"
          prefetch={false}
          className="inline-flex min-h-11 w-fit items-center justify-center bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Open Cabinet
        </Link>
      </section>

      <footer className="flex flex-wrap justify-between gap-3 border-t border-brand-border py-6 font-mono text-xs text-brand-muted">
        <span>Cabinet</span>
        <span>Bookmarks · Notes · Reading</span>
      </footer>
    </main>
  )
}
