import { seedDatabase } from "../lib/db/seed";

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
