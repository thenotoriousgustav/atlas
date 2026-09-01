-- CreateEnum
CREATE TYPE "BookmarkProvider" AS ENUM ('REDDIT');

-- CreateEnum
CREATE TYPE "BookmarkContentType" AS ENUM ('SOCIAL_POST', 'IMAGE', 'VIDEO', 'ARTICLE', 'LINK', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MetadataStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "bookmarks" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "contentType" "BookmarkContentType",
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "lastEnrichedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "metadataError" TEXT,
ADD COLUMN     "metadataStatus" "MetadataStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "provider" "BookmarkProvider",
ADD COLUMN     "siteName" TEXT;

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "icon" TEXT,
    "color" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_trackers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "type" TEXT NOT NULL DEFAULT 'BOOLEAN',
    "goalValue" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "goalUnit" TEXT,
    "goalFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "goalDirection" TEXT NOT NULL DEFAULT 'INCREASING',
    "color" TEXT NOT NULL DEFAULT 'emerald',
    "reminderTime" TEXT,
    "quickSteppers" INTEGER[] DEFAULT ARRAY[1, 5]::INTEGER[],
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "habit_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_entries" (
    "id" UUID NOT NULL,
    "trackerId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "durationSeconds" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_categories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT 'emerald',
    "icon" TEXT DEFAULT 'FolderSimple',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "habit_entries_trackerId_date_key" ON "habit_entries"("trackerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_categories_userId_name_key" ON "habit_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "bookmarks_provider_idx" ON "bookmarks"("provider");

-- CreateIndex
CREATE INDEX "bookmarks_metadataStatus_idx" ON "bookmarks"("metadataStatus");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_trackers" ADD CONSTRAINT "habit_trackers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "habit_trackers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_categories" ADD CONSTRAINT "habit_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
