-- CreateTable
CREATE TABLE "ComboDiscountTier" (
    "id" TEXT NOT NULL,
    "minPerks" INTEGER NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "maxDiscountVnd" BIGINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboDiscountTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComboDiscountTier_minPerks_key" ON "ComboDiscountTier"("minPerks");
