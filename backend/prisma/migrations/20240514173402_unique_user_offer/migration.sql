/*
  Warnings:

  - A unique constraint covering the columns `[offerId,userId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_offerId_userId_key" ON "Transaction"("offerId", "userId");
