-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('TEMPERATURE', 'HUMIDITY');

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "measuredValue" DOUBLE PRECISION NOT NULL,
    "minAllowed" DOUBLE PRECISION NOT NULL,
    "maxAllowed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_warehouseId_type_resolvedAt_idx" ON "Alert"("warehouseId", "type", "resolvedAt");
