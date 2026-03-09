-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "stripeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeId_key" ON "Transaction"("stripeId");
