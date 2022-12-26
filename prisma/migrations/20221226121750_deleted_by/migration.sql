/*
  Warnings:

  - The `deletedBy` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_deletedBy_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "deletedBy",
ADD COLUMN     "deletedBy" UUID;
