-- DropForeignKey
ALTER TABLE "public"."Sheet" DROP CONSTRAINT "Sheet_companyId_fkey";

-- AlterTable
ALTER TABLE "public"."Sheet" ALTER COLUMN "content" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."Sheet" ADD CONSTRAINT "Sheet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
