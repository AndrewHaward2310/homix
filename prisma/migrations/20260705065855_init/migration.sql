-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'host', 'agent');

-- CreateEnum
CREATE TYPE "TowerStatus" AS ENUM ('selling', 'sold_out', 'coming_soon');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('sale', 'rent_long', 'stay_short');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'reserved', 'unavailable');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'approved', 'declined');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('new', 'consulting', 'closed');

-- CreateEnum
CREATE TYPE "PerkCategory" AS ENUM ('bbq', 'lake_ticket', 'vehicle', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "phone" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'vi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tower" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "priceFromVnd" BIGINT NOT NULL,
    "status" "TowerStatus" NOT NULL,
    "image" TEXT NOT NULL,
    "mapLng" DOUBLE PRECISION,
    "mapLat" DOUBLE PRECISION,
    "bedroomsMin" INTEGER,
    "bedroomsMax" INTEGER,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "type" "PropertyType" NOT NULL,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "priceVnd" BIGINT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PropertyStatus" NOT NULL,
    "towerId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "checkIn" TEXT,
    "checkOut" TEXT,
    "viewingAt" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "totalVnd" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "needSummary" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'new',
    "assignedAgentId" TEXT NOT NULL,
    "matchedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perk" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "priceVnd" BIGINT NOT NULL,
    "category" "PerkCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "Property_towerId_idx" ON "Property"("towerId");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");

-- CreateIndex
CREATE INDEX "Lead_assignedAgentId_idx" ON "Lead"("assignedAgentId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
