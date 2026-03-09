-- AlterEnum: add PENDING_QUOTE to ReservationStatus
ALTER TYPE "ReservationStatus" ADD VALUE 'PENDING_QUOTE';

-- AlterEnum: add ORGANIZATION to ReservationType
ALTER TYPE "ReservationType" ADD VALUE 'ORGANIZATION';

-- AlterTable User: rename name → firstName, add lastName + new columns
ALTER TABLE "User" RENAME COLUMN "name" TO "firstName";
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ADD COLUMN "lastName"              TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "lastName"            DROP DEFAULT;
ALTER TABLE "User" ADD COLUMN "deletionRequestedAt"   TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "address"               TEXT;
ALTER TABLE "User" ADD COLUMN "phone"                 TEXT;
ALTER TABLE "User" ADD COLUMN "city"                  TEXT;
ALTER TABLE "User" ADD COLUMN "tarifReduitRequested"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "cguAccepted"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerified"         TIMESTAMP(3);

-- AlterTable Reservation: make userId nullable, add new columns
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";
ALTER TABLE "Reservation" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Reservation" ADD COLUMN "label"        TEXT;
ALTER TABLE "Reservation" ADD COLUMN "companyName"  TEXT;
ALTER TABLE "Reservation" ADD COLUMN "message"      TEXT;
ALTER TABLE "Reservation" ADD COLUMN "contactName"  TEXT;
ALTER TABLE "Reservation" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "startTime"    TEXT;
ALTER TABLE "Reservation" ADD COLUMN "endTime"      TEXT;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmailVerificationToken
CREATE TABLE "EmailVerificationToken" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerifiedUserToken
CREATE TABLE "VerifiedUserToken" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerifiedUserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable Event
CREATE TABLE "Event" (
    "id"              TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "description"     TEXT NOT NULL,
    "date"            TIMESTAMP(3) NOT NULL,
    "registrationUrl" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key"     ON "PasswordResetToken"("token");
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE UNIQUE INDEX "VerifiedUserToken_token_key"      ON "VerifiedUserToken"("token");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VerifiedUserToken" ADD CONSTRAINT "VerifiedUserToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
