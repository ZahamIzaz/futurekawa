-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('COMPLIANT', 'ALERT', 'EXPIRED');

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "storageDate" TIMESTAMP(3) NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'COMPLIANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lot_storageDate_idx" ON "Lot"("storageDate");

-- CreateIndex
CREATE INDEX "Lot_warehouseId_idx" ON "Lot"("warehouseId");
