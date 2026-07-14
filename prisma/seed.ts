import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

/**
 * Seeds baseline feature flags. Does NOT create fake users/tournaments —
 * real users are created via the Clerk webhook on first login.
 *
 * To bootstrap the very first DEVELOPER account (there's no admin yet to
 * promote anyone), sign in once with your company email, then run:
 *   npx prisma studio
 * and manually set that User row's `role` to DEVELOPER.
 */
async function main() {
  await db.featureFlag.upsert({
    where: { key: "betting_enabled" },
    update: {},
    create: {
      key: "betting_enabled",
      enabled: true,
      description: "Master switch for the betting feature across all tournaments.",
    },
  })

  await db.featureFlag.upsert({
    where: { key: "csv_export_enabled" },
    update: {},
    create: {
      key: "csv_export_enabled",
      enabled: true,
      description: "Allow admins to export tournament results as CSV.",
    },
  })

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
