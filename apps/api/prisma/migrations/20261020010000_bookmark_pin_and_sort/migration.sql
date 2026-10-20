ALTER TABLE "bookmarks"
  ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sortTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "sortDomain" TEXT;

-- Backfill existing libraries, including notes (which have no domain).
UPDATE "bookmarks"
SET "sortTitle" = lower("title"),
    "sortDomain" = nullif(regexp_replace(lower(substring("url" from '(?i)^https?://(?:[^/@]*@)?(\[[^]]+\]|[^/:?#]+)')), '^www\.', ''), '');

DROP INDEX IF EXISTS "bookmarks_userId_deletedAt_position_idx";
CREATE INDEX "bookmarks_userId_deletedAt_isPinned_position_idx"
  ON "bookmarks"("userId", "deletedAt", "isPinned" DESC, "position");
