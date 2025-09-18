/*
  Warnings:

  - Added the required column `barangayId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "barangayId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "public"."Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
