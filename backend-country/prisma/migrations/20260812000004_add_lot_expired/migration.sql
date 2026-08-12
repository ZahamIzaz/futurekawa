-- AlterEnum : ajout de la valeur LOT_EXPIRED
ALTER TYPE "AlertType" ADD VALUE 'LOT_EXPIRED';

-- AlterTable : ajout de lotId (nullable) sur Alert
ALTER TABLE "Alert" ADD COLUMN "lotId" TEXT;

-- CreateIndex : recherche efficace d'une alerte LOT_EXPIRED par lot
CREATE INDEX "Alert_lotId_type_idx" ON "Alert"("lotId", "type");
