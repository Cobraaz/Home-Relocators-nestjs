-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'MOVER', 'ADMIN');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "uniqueID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "avatar" TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/cobraaz/image/upload/v1595762337/gez4i626tlesoe3plwn7.jpg',
    "hashedAt" TEXT,
    "hashedRt" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emailActivation" (
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activationToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "emailActivation_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_uniqueID_key" ON "user"("uniqueID");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "emailActivation_email_key" ON "emailActivation"("email");
