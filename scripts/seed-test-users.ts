import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const TEST_USERS = [
  { name: "Priya Rao", email: "priya.rao@lumiq.ai" },
  { name: "Rahul Mehta", email: "rahul.mehta@lumiq.ai" },
  { name: "Ananya Iyer", email: "ananya.iyer@lumiq.ai" },
  { name: "Vikram Nair", email: "vikram.nair@lumiq.ai" },
  { name: "Sneha Kapoor", email: "sneha.kapoor@lumiq.ai" },
  { name: "Arjun Desai", email: "arjun.desai@lumiq.ai" },
  { name: "Kavya Menon", email: "kavya.menon@lumiq.ai" },
]

async function main() {
  for (const u of TEST_USERS) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        clerkId: `test_${u.email.split("@")[0].replace(".", "_")}`,
        email: u.email,
        name: u.name,
      },
    })
  }
  console.log(`Seeded ${TEST_USERS.length} test users:`)
  TEST_USERS.forEach((u) => console.log(`  ${u.email}`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
