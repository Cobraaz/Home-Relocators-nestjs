-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'SELLER', 'ADMIN');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "uniqueID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "avatar" TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/cobraaz/image/upload/v1595762337/gez4i626tlesoe3plwn7.jpg',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
