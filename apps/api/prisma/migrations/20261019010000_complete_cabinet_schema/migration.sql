-- Complete schema fields that previously existed only in development databases.
-- IF NOT EXISTS also permits upgrading those databases without deleting data.
DO $$ BEGIN
    CREATE TYPE "BookmarkType" AS ENUM ('BOOKMARK', 'NOTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "bookmarks"
    ADD COLUMN IF NOT EXISTS "type" "BookmarkType" NOT NULL DEFAULT 'BOOKMARK',
    ADD COLUMN IF NOT EXISTS "notes" TEXT,
    ALTER COLUMN "url" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "bookmarks_type_idx" ON "bookmarks"("type");

CREATE TABLE IF NOT EXISTS "bookmark_articles" (
    "id" UUID NOT NULL,
    "bookmarkId" UUID NOT NULL,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "readingTimeMinutes" INTEGER,
    "wordCount" INTEGER,
    "contentHtml" TEXT,
    "contentMarkdown" TEXT,
    "waybackUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "scrollProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookmark_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookmark_articles_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "bookmark_articles_bookmarkId_key" ON "bookmark_articles"("bookmarkId");
