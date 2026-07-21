-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "targetAmount" DOUBLE PRECISION,
ADD COLUMN     "targetMonth" INTEGER,
ADD COLUMN     "targetType" TEXT,
ADD COLUMN     "targetYear" INTEGER;
