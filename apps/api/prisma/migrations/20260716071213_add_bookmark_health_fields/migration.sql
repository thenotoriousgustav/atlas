-- AlterTable
ALTER TABLE "bookmarks" ADD COLUMN     "lastChecked" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OK',
ADD COLUMN     "statusCode" INTEGER;
