/*
  Warnings:

  - Changed the type of `expirationAt` on the `emailActivation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "emailActivation" DROP COLUMN "expirationAt",
ADD COLUMN     "expirationAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "forgetPassword" (
    "email" TEXT NOT NULL,
    "resetingOtp" TEXT NOT NULL,
    "expirationAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "forgetPassword_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "forgetPassword_email_key" ON "forgetPassword"("email");
