BEGIN;

ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "oauth_accounts_provider_subject_key" ON "oauth_accounts"("provider", "subject");
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

ALTER TABLE "tags" ADD COLUMN "userId" UUID;
DROP INDEX "tags_name_key";

-- Preserve tag IDs where possible; split tags shared by multiple users.
CREATE TEMP TABLE "tag_owners" ON COMMIT DROP AS
SELECT "tagId", "userId",
       CASE WHEN ROW_NUMBER() OVER (PARTITION BY "tagId" ORDER BY "userId") = 1
            THEN "tagId" ELSE gen_random_uuid() END AS "newId"
FROM (
    SELECT DISTINCT t."id" AS "tagId", b."userId"
    FROM "tags" t
    JOIN "_BookmarkTags" bt ON bt."B" = t."id"
    JOIN "bookmarks" b ON b."id" = bt."A"
    UNION
    SELECT t."id", (SELECT "id" FROM "users" ORDER BY "createdAt", "id" LIMIT 1)
    FROM "tags" t
    WHERE NOT EXISTS (SELECT 1 FROM "_BookmarkTags" bt WHERE bt."B" = t."id")
) owners;

UPDATE "tags" t SET "userId" = o."userId"
FROM "tag_owners" o WHERE t."id" = o."tagId" AND o."newId" = o."tagId";

INSERT INTO "tags" ("id", "name", "userId", "createdAt", "updatedAt")
SELECT o."newId", t."name", o."userId", t."createdAt", t."updatedAt"
FROM "tag_owners" o JOIN "tags" t ON t."id" = o."tagId"
WHERE o."newId" <> o."tagId";

UPDATE "_BookmarkTags" bt SET "B" = o."newId"
FROM "tag_owners" o, "bookmarks" b
WHERE bt."B" = o."tagId" AND bt."A" = b."id" AND b."userId" = o."userId";

CREATE UNIQUE INDEX "tags_name_userId_key" ON "tags"("name", "userId");
CREATE INDEX "tags_userId_idx" ON "tags"("userId");
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Legacy passkey records remain stored, but no passkey endpoints remain active.
COMMIT;
