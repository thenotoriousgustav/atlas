-- Drop unused legacy authentication and reader tables
DROP TABLE IF EXISTS "refresh_tokens";
DROP TABLE IF EXISTS "user_credentials";
DROP TABLE IF EXISTS "oauth_accounts";
DROP TABLE IF EXISTS "bookmark_articles";

-- Remove obsolete columns from bookmarks and users
ALTER TABLE "bookmarks"
    DROP COLUMN IF EXISTS "canonicalUrl",
    DROP COLUMN IF EXISTS "metadata",
    DROP COLUMN IF EXISTS "provider";

ALTER TABLE "users"
    DROP COLUMN IF EXISTS "password";

DROP TYPE IF EXISTS "BookmarkProvider";

-- Add performance composite indexes for bookmark queries and folder listings
CREATE INDEX IF NOT EXISTS "bookmarks_userId_deletedAt_position_idx" ON "bookmarks"("userId", "deletedAt", "position");
CREATE INDEX IF NOT EXISTS "bookmarks_userId_folderId_deletedAt_idx" ON "bookmarks"("userId", "folderId", "deletedAt");
