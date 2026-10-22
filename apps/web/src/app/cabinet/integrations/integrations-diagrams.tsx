import React from "react"

/**
 * Clean, flat vector illustrations representing browser interfaces and export flows.
 * Uses semantic theme tokens (foreground, muted, border, card, library-olive) so it adapts
 * automatically to light and dark modes without harsh gradients or glowing effects.
 */

export function PipelineDiagram() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card p-4 sm:p-6" role="figure" aria-label="Alur Impor dan Ekspor Bookmark Cabinet">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3">
          {/* Step 1: Source */}
          <div className="flex flex-col justify-between rounded-md border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sumber Asal</span>
              <span className="rounded bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground border border-border/80">Langkah 1</span>
            </div>
            <div className="py-4">
              <p className="font-serif text-lg text-foreground">Browser &amp; Aplikasi</p>
              <p className="mt-1 text-xs text-muted-foreground">Chrome, Safari, Raindrop, Arc, Firefox, atau Pocket tempat koleksi link Anda berada.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
              <span className="rounded border border-border/80 bg-background px-2 py-0.5">Google Chrome</span>
              <span className="rounded border border-border/80 bg-background px-2 py-0.5">Apple Safari</span>
              <span className="rounded border border-border/80 bg-background px-2 py-0.5">Raindrop.io</span>
            </div>
          </div>

          {/* Step 2: Intermediate format */}
          <div className="flex flex-col justify-between rounded-md border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format Netscape</span>
              <span className="rounded bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground border border-border/80">Langkah 2</span>
            </div>
            <div className="py-4">
              <p className="font-serif text-lg text-foreground">Berkas HTML Standar</p>
              <p className="mt-1 text-xs text-muted-foreground">Format universal yang menyimpan judul, alamat URL, tanggal simpan, dan hierarki folder.</p>
            </div>
            <div className="rounded border border-border/80 bg-background p-2 font-mono text-[11px] text-foreground/80">
              <code>bookmarks_date.html</code>
            </div>
          </div>

          {/* Step 3: Cabinet destination */}
          <div className="flex flex-col justify-between rounded-md border border-library-olive/40 bg-library-highlight/30 p-4 dark:bg-library-olive/10">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-library-olive dark:text-foreground">Tujuan</span>
              <span className="rounded bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground border border-border/80">Langkah 3</span>
            </div>
            <div className="py-4">
              <p className="font-serif text-lg text-foreground">Perpustakaan Cabinet</p>
              <p className="mt-1 text-xs text-muted-foreground">Pilah folder otomatis, simpan catatan, perbarui gambar preview di latar belakang.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-library-olive dark:text-foreground">
              <span className="inline-block size-2 rounded-full bg-library-olive" aria-hidden="true" />
              Siap dibaca di web &amp; mobile
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChromeExportIllustration() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card" aria-hidden="true">
      {/* Fake Browser Window Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-2 font-mono text-[11px]">chrome://bookmarks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Google Chrome</span>
        </div>
      </div>

      {/* Mock Chrome UI layout */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 border-b border-border/80 pb-2 text-xs font-medium text-foreground">
              <span>Bookmark Manager</span>
              <span className="text-muted-foreground">/ Folders / All Bookmarks</span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1">
                <span>📁 Reading List</span>
                <span className="text-[11px] text-muted-foreground">(24 items)</span>
              </div>
              <div className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1">
                <span>📁 Work &amp; Research</span>
                <span className="text-[11px] text-muted-foreground">(58 items)</span>
              </div>
              <div className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1">
                <span>📁 Design Inspirations</span>
                <span className="text-[11px] text-muted-foreground">(112 items)</span>
              </div>
            </div>
          </div>

          {/* Simulated 3-dots Dropdown Menu */}
          <div className="w-full sm:w-56 shrink-0 rounded border border-foreground/20 bg-background p-1.5 shadow-sm">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">Menu Bookmark Manager (⋮)</div>
            <div className="my-1 border-t border-border" />
            <div className="px-2 py-1 text-xs text-muted-foreground line-through">Sort by name</div>
            <div className="px-2 py-1 text-xs text-muted-foreground">Add new folder</div>
            <div className="my-1 border-t border-border" />
            <div className="rounded bg-foreground px-2 py-1.5 text-xs font-medium text-background">
              ✓ Export bookmarks...
            </div>
            <div className="px-2 py-1 text-xs text-muted-foreground">Import bookmarks...</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SafariExportIllustration() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card" aria-hidden="true">
      {/* macOS Menu Bar Mockup */}
      <div className="flex items-center gap-4 border-b border-border bg-muted/70 px-3 py-1.5 text-xs text-foreground">
        <span className="font-semibold"></span>
        <span className="font-semibold">Safari</span>
        <span className="rounded bg-foreground px-1.5 py-0.5 text-background font-medium">File (Berkas)</span>
        <span className="text-muted-foreground">Edit</span>
        <span className="text-muted-foreground">View</span>
        <span className="text-muted-foreground">History</span>
        <span className="text-muted-foreground">Bookmarks</span>
      </div>

      {/* Mock Menu Dropdown */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Menu Bar Safari di macOS</p>
            <p className="mt-1 leading-relaxed">
              Ekspor Safari menghasilkan satu berkas bernama <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">Safari Bookmarks.html</code> yang memuat daftar bacaan, bilah favorit, dan folder kustom.
            </p>
          </div>

          <div className="w-full sm:w-60 shrink-0 rounded border border-foreground/20 bg-background p-1.5 shadow-sm">
            <div className="px-2 py-1 text-xs text-muted-foreground">New Window</div>
            <div className="px-2 py-1 text-xs text-muted-foreground">New Private Window</div>
            <div className="px-2 py-1 text-xs text-muted-foreground">Open File...</div>
            <div className="my-1 border-t border-border" />
            <div className="px-2 py-1 text-xs text-muted-foreground">Import From...</div>
            <div className="rounded bg-foreground px-2 py-1.5 text-xs font-medium text-background">
              ✓ Export Bookmarks...
            </div>
            <div className="my-1 border-t border-border" />
            <div className="px-2 py-1 text-xs text-muted-foreground">Close Window</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExtensionWorkflowIllustration() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card" aria-hidden="true">
      {/* Browser tab + extension action mockup */}
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="rounded bg-background px-2 py-0.5 text-[11px] font-medium text-foreground border border-border">Tab Aktif</span>
          <span className="truncate max-w-[200px] text-foreground">https://example.com/article</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">⌘⇧S</span>
          <span className="rounded bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">Cabinet Extension</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 text-xs text-muted-foreground">
            <p className="font-serif text-base text-foreground">Simpan Otomatis Tanpa Unduh Berkas</p>
            <p className="mt-1 leading-relaxed">
              Ekstensi Cabinet membaca sesi login browser Anda secara aman. Cukup tekan pintasan keyboard untuk menyimpan link, kutipan teks, atau catatan langsung ke folder yang Anda inginkan.
            </p>
          </div>

          <div className="w-full sm:w-64 shrink-0 rounded-lg border border-border bg-background p-3 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-medium text-foreground">Save to Cabinet</span>
              <span className="rounded bg-secondary px-1 text-[11px] text-muted-foreground">v0.1.0</span>
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              <span className="font-medium text-foreground truncate">A practical guide to design</span>
              <span className="font-mono text-[11px] text-muted-foreground">example.com/article</span>
              <div className="mt-1 rounded border border-border/80 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                Folder: <span className="font-medium text-foreground">Design references</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-library-olive font-medium">✓ Ready to save</span>
                <span className="rounded bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">Save</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
