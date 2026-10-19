-- Keep legacy note text and store structured editor content separately.
ALTER TABLE "bookmarks" ADD COLUMN "noteDocument" JSONB;
