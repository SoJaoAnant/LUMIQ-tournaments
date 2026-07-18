import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const TEST_USERS = [
  { name: "Priya Rao", email: "priya.rao@gmail.com" },
  { name: "Rahul Mehta", email: "rahul.mehta@gmail.com" },
  { name: "Ananya Iyer", email: "ananya.iyer@gmail.com" },
  { name: "Vikram Nair", email: "vikram.nair@gmail.com" },
  { name: "Sneha Kapoor", email: "sneha.kapoor@gmail.com" },
  { name: "Arjun Desai", email: "arjun.desai@gmail.com" },
  { name: "Kavya Menon", email: "kavya.menon@gmail.com" },
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
