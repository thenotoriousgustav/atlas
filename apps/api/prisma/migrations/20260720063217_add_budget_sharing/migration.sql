-- CreateTable
CREATE TABLE "budget_shares" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "grantedToId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_shares_ownerId_grantedToId_key" ON "budget_shares"("ownerId", "grantedToId");

-- AddForeignKey
ALTER TABLE "budget_shares" ADD CONSTRAINT "budget_shares_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_shares" ADD CONSTRAINT "budget_shares_grantedToId_fkey" FOREIGN KEY ("grantedToId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
