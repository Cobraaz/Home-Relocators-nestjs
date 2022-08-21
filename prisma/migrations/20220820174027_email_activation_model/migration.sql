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
CREATE UNIQUE INDEX "emailActivation_email_key" ON "emailActivation"("email");
