/*
  Warnings:

  - A unique constraint covering the columns `[officialCode]` on the table `Barangay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Municipality` will be added. If there are existing duplicate values, this will fail.
  - Made the column `officialCode` on table `Barangay` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `Municipality` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Barangay" ALTER COLUMN "officialCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Municipality" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Barangay_officialCode_key" ON "public"."Barangay"("officialCode");

-- CreateIndex
CREATE INDEX "Barangay_officialCode_idx" ON "public"."Barangay"("officialCode");

-- CreateIndex
CREATE UNIQUE INDEX "Municipality_code_key" ON "public"."Municipality"("code");

-- CreateIndex
CREATE INDEX "Municipality_code_idx" ON "public"."Municipality"("code");
