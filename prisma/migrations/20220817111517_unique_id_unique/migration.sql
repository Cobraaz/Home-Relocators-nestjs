/*
  Warnings:

  - A unique constraint covering the columns `[uniqueID]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_uniqueID_key" ON "user"("uniqueID");
