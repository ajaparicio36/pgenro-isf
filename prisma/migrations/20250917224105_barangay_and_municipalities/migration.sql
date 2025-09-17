/*
  Warnings:

  - You are about to drop the `Sheet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Sheet" DROP CONSTRAINT "Sheet_companyId_fkey";

-- DropTable
DROP TABLE "public"."Sheet";

-- CreateTable
CREATE TABLE "public"."Municipality" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Barangay" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "municipalityId" UUID NOT NULL,
    "officialCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barangay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Barangay_name_municipalityId_key" ON "public"."Barangay"("name", "municipalityId");

-- AddForeignKey
ALTER TABLE "public"."Barangay" ADD CONSTRAINT "Barangay_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."Municipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
