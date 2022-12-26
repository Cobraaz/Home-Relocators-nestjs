/*
  Warnings:

  - You are about to drop the column `index` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "index",
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "disable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sequenceNumber" SERIAL NOT NULL,
ALTER COLUMN "avatar" SET DEFAULT '';

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
