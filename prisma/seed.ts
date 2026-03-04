/**
 * prisma/seed.ts
 * Seeder Place V — 5 utilisateurs de test + SystemSettings.
 * Lancer avec : npx prisma db seed
 * Prisma 7 : PrismaClient nécessite le driver adapter Neon + WebSocket en Node.js.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import bcrypt from "bcrypt"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    "DATABASE_URL est requis pour le seed. Vérifier .env.local"
  )
}

const adapter = new PrismaNeonHttp(connectionString, {} as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding Place V database…")

  // ─── Nettoyage : réservations futures des comptes de test ─────────────────
  // Supprime les réservations futures pour garantir l'idempotence des tests E2E.
  // Les crédits sont réinitialisés via upsert ci-dessous.
  const TEST_EMAILS = [
    "externe@test.fr",
    "pauvre@test.fr",
    "bouliacais@test.fr",
    "reduit@test.fr",
  ]
  const testUsers = await prisma.user.findMany({
    where: { email: { in: TEST_EMAILS } },
    select: { id: true },
  })
  if (testUsers.length > 0) {
    const ids = testUsers.map((u) => u.id)
    await prisma.reservation.deleteMany({
      where: { userId: { in: ids }, date: { gte: new Date() } },
    })
    console.log("  ✓ Réservations futures des comptes de test supprimées")
  }

  // Nettoyer les fermetures futures pour les tests
  await prisma.closedDate.deleteMany({
    where: { date: { gte: new Date() } }
  })
  console.log("  ✓ Dates de fermeture futures supprimées")

  const passwordHash = await bcrypt.hash("TestPassword123!", 12)

  // ─── Utilisateurs de test ─────────────────────────────────────────────────

  const users = [
    {
      email: "admin@placev.fr",
      name: "Admin Place V",
      role: "ADMIN" as const,
      segment: "BOULIACAIS" as const,
      credits: 99,
      emailVerified: new Date(),
    },
    {
      email: "externe@test.fr",
      name: "Externe Test",
      role: "USER" as const,
      segment: "EXTERNE" as const,
      credits: 5,
      emailVerified: new Date(),
    },
    {
      email: "bouliacais@test.fr",
      name: "Bouliacais Test",
      role: "USER" as const,
      segment: "BOULIACAIS" as const,
      credits: 3,
      emailVerified: new Date(),
    },
    {
      email: "reduit@test.fr",
      name: "Réduit Test",
      role: "USER" as const,
      segment: "REDUIT" as const,
      credits: 2,
      emailVerified: new Date(),
    },
    {
      email: "pauvre@test.fr",
      name: "Pauvre Test",
      role: "USER" as const,
      segment: "EXTERNE" as const,
      credits: 0, // Slice 8 : seuil = 0, crédits=0 → toute réservation refusée
      emailVerified: new Date(),
    },
    {
      email: "unverified@test.fr",
      name: "Unverified Test",
      role: "USER" as const,
      segment: "EXTERNE" as const,
      credits: 0,
      cguAccepted: true,
      emailVerified: null,
    },
  ]

  for (const userData of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        credits: userData.credits,
        role: userData.role,
        segment: userData.segment,
        emailVerified: userData.emailVerified,
      },
      create: {
        ...userData,
        passwordHash,
      },
    })
    console.log(`  ✓ ${userData.email}`)

    if (userData.email === "unverified@test.fr") {
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: createdUser.id },
      })
      await prisma.emailVerificationToken.create({
        data: {
          token: "seed-valid-ev-token-001",
          userId: createdUser.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      console.log(`  ✓ Token généré pour unverified@test.fr`)
    }
  }

  // ─── SystemSettings ───────────────────────────────────────────────────────

  const settings = [
    { key: "DESK_CAPACITY", value: "15" },
    { key: "OPEN_DAYS", value: "1,2,3" },
    { key: "PRICE_CREDIT_BOULIACAIS", value: "700" },
    { key: "PRICE_CREDIT_EXTERNE", value: "800" },
    { key: "PRICE_CREDIT_REDUIT", value: "400" },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
    console.log(`  ✓ ${setting.key} = ${setting.value}`)
  }

  console.log("✅ Seed terminé")
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
