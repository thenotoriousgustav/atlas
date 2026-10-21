export interface NoteSnapshot {
  folderId?: string
  /** Undefined leaves the saved tags untouched (older local drafts have none). */
  tags?: string[]
  title: string
  notes: string
  noteDocument: Record<string, any>
}

export type NoteSaveStatus = "saved" | "unsaved" | "saving" | "error"

/** Serializes writes so an older request cannot overwrite more recent typing. */
export class NoteAutosave<T extends object = NoteSnapshot> {
  private pending: T | null = null
  private inFlight: Promise<boolean> | null = null
  private timer: ReturnType<typeof setTimeout> | undefined

  private save: (snapshot: T) => Promise<void>
  private status: (status: NoteSaveStatus) => void
  private delay: number

  constructor(
    save: (snapshot: T) => Promise<void>,
    status: (status: NoteSaveStatus) => void,
    delay = 800
  ) {
    this.save = save
    this.status = status
    this.delay = delay
  }

  get hasUnsavedChanges() {
    return this.pending !== null || this.inFlight !== null
  }

  schedule(snapshot: T) {
    this.pending = snapshot
    this.status("unsaved")
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      void this.flush()
    }, this.delay)
  }

  flush(): Promise<boolean> {
    clearTimeout(this.timer)
    if (this.inFlight) return this.inFlight
    this.inFlight = this.drain().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  private async drain() {
    while (this.pending) {
      const snapshot = this.pending
      this.pending = null
      this.status("saving")
      try {
        await this.save(snapshot)
      } catch {
        this.pending ??= snapshot
        this.status("error")
        return false
      }
    }
    this.status("saved")
    return true
  }

  dispose() {
    clearTimeout(this.timer)
  }
}
