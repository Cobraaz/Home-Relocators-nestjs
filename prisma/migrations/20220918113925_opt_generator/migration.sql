/*
  Warnings:

  - You are about to drop the column `activationToken` on the `emailActivation` table. All the data in the column will be lost.
  - Added the required column `activationOtp` to the `emailActivation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expirationAt` to the `emailActivation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emailActivation" DROP COLUMN "activationToken",
ADD COLUMN     "activationOtp" TEXT NOT NULL,
ADD COLUMN     "expirationAt" TEXT NOT NULL;
