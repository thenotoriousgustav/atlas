-- CreateTable
CREATE TABLE "fetch_histories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "platform" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION,
    "resolution" TEXT,
    "thumbnail" TEXT,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "collectionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fetch_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_collections" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fetch_collections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fetch_histories" ADD CONSTRAINT "fetch_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_histories" ADD CONSTRAINT "fetch_histories_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "fetch_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_collections" ADD CONSTRAINT "fetch_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
