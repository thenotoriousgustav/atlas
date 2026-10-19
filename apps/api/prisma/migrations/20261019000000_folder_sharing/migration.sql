-- Sharing is opt-in. Existing folders remain private.
ALTER TABLE "folders" ADD COLUMN "shareToken" VARCHAR(64);
CREATE UNIQUE INDEX "folders_shareToken_key" ON "folders"("shareToken");
