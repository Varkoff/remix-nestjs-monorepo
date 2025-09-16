/*
  Warnings:

  - A unique constraint covering the columns `[stripeProductId]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceId]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Offer_stripeProductId_key" ON "Offer"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_stripePriceId_key" ON "Offer"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripePaymentIntentId_key" ON "Transaction"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeCheckoutSessionId_key" ON "Transaction"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeAccountId_key" ON "User"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
