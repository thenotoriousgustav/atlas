BEGIN;

ALTER TABLE "folders" ADD COLUMN "inviteTokenHash" VARCHAR(64);
CREATE UNIQUE INDEX "folders_inviteTokenHash_key" ON "folders"("inviteTokenHash");

CREATE TABLE "folder_members" (
    "folderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "folder_members_pkey" PRIMARY KEY ("folderId", "userId"),
    CONSTRAINT "folder_members_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "folder_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "folder_members_userId_idx" ON "folder_members"("userId");

COMMIT;
