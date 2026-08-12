-- CreateTable
CREATE TABLE "Measurement" (
    "id" SERIAL NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Measurement_warehouseId_idx" ON "Measurement"("warehouseId");

-- CreateIndex
CREATE INDEX "Measurement_timestamp_idx" ON "Measurement"("timestamp");
