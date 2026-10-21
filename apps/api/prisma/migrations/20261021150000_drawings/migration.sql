-- Excalidraw drawings as a third kind of saved item.
ALTER TYPE "BookmarkType" ADD VALUE IF NOT EXISTS 'DRAWING';

ALTER TABLE "bookmarks" ADD COLUMN "drawing" JSONB;
