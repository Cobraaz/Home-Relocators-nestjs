/*
  Warnings:

  - The primary key for the `forgetPassword` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `forgetPassword` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uniqueID` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userEmail]` on the table `forgetPassword` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userEmail` to the `forgetPassword` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "forgetPassword_email_key";

-- DropIndex
DROP INDEX "user_uniqueID_key";

-- AlterTable
ALTER TABLE "forgetPassword" DROP CONSTRAINT "forgetPassword_pkey",
DROP COLUMN "email",
ADD COLUMN     "userEmail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "uniqueID",
ADD COLUMN     "index" SERIAL NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "forgetPassword_userEmail_key" ON "forgetPassword"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- AddForeignKey
ALTER TABLE "forgetPassword" ADD CONSTRAINT "forgetPassword_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
