-- CreateTable
CREATE TABLE "public"."Steward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateIssued" DATE NOT NULL,
    "dateExpiry" DATE NOT NULL,
    "cscNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "geojson" TEXT,
    "barangayId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Steward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evaluation" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "recommendation" TEXT,
    "ratingRemarks" TEXT,
    "actionTaken" TEXT,
    "generalRemarks" TEXT,
    "stewardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Steward_cscNumber_key" ON "public"."Steward"("cscNumber");

-- AddForeignKey
ALTER TABLE "public"."Steward" ADD CONSTRAINT "Steward_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "public"."Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Steward" ADD CONSTRAINT "Steward_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."Municipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evaluation" ADD CONSTRAINT "Evaluation_stewardId_fkey" FOREIGN KEY ("stewardId") REFERENCES "public"."Steward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
