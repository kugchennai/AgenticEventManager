-- CreateEnum
CREATE TYPE "VenuePartnerStatus" AS ENUM ('INQUIRY', 'PENDING', 'CONFIRMED', 'CONTRACTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "VenuePartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "capacity" INTEGER,
    "notes" TEXT,
    "website" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenuePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVenuePartner" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venuePartnerId" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" "VenuePartnerStatus" NOT NULL DEFAULT 'INQUIRY',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "confirmationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventVenuePartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventVenuePartner_eventId_venuePartnerId_key" ON "EventVenuePartner"("eventId", "venuePartnerId");

-- AddForeignKey
ALTER TABLE "EventVenuePartner" ADD CONSTRAINT "EventVenuePartner_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVenuePartner" ADD CONSTRAINT "EventVenuePartner_venuePartnerId_fkey" FOREIGN KEY ("venuePartnerId") REFERENCES "VenuePartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVenuePartner" ADD CONSTRAINT "EventVenuePartner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
