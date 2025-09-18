/*
  Warnings:

  - The primary key for the `Barangay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Municipality` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."Barangay" DROP CONSTRAINT "Barangay_municipalityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_companyId_fkey";

-- AlterTable
ALTER TABLE "public"."Barangay" DROP CONSTRAINT "Barangay_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "municipalityId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Barangay_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Municipality" DROP CONSTRAINT "Municipality_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectCode" TEXT,
    "title" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "totalAreaDeveloped" DOUBLE PRECISION,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "totalProjectCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Component" (
    "id" TEXT NOT NULL,
    "componentTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectComponent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "componentTitle" TEXT NOT NULL,
    "componentDescription" TEXT,
    "componentCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "public"."Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "public"."Project"("status");

-- CreateIndex
CREATE INDEX "Project_startDate_idx" ON "public"."Project"("startDate");

-- CreateIndex
CREATE INDEX "ProjectComponent_projectId_idx" ON "public"."ProjectComponent"("projectId");

-- CreateIndex
CREATE INDEX "Attachment_projectId_idx" ON "public"."Attachment"("projectId");

-- AddForeignKey
ALTER TABLE "public"."Barangay" ADD CONSTRAINT "Barangay_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."Municipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectComponent" ADD CONSTRAINT "ProjectComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
