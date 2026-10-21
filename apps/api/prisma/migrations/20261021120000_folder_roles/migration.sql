-- Folder sharing roles. Existing members and invitation links keep today's
-- behavior (add items, manage their own) as CONTRIBUTOR.
CREATE TYPE "FolderRole" AS ENUM ('VIEWER', 'CONTRIBUTOR', 'EDITOR');

ALTER TABLE "folder_members" ADD COLUMN "role" "FolderRole" NOT NULL DEFAULT 'CONTRIBUTOR';

ALTER TABLE "folders" ADD COLUMN "inviteRole" "FolderRole" NOT NULL DEFAULT 'CONTRIBUTOR';
