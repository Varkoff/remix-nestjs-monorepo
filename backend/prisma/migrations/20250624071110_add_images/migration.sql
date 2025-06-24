/*
  Warnings:

  - A unique constraint covering the columns `[imageFileKey]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarFileKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "imageFileKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarFileKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Offer_imageFileKey_key" ON "Offer"("imageFileKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarFileKey_key" ON "User"("avatarFileKey");
