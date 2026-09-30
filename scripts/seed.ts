import "dotenv/config";
import { sql } from "drizzle-orm";

async function main() {
  const { db, pool } = await import("../src/db");
  const { seedDatabase } = await import("../src/db/seeding");
  const { ensureDb } = await import("../src/db/bootstrap");

  await ensureDb(); // create tables if missing (also seeds if empty)

  console.log("→ Truncating tables for a full reseed…");
  await db.execute(sql`
    TRUNCATE staff, doctors, doctor_clinics, patients, implant_systems,
    sleeve_kits, sleeve_compat, case_types, statuses, package_tiers,
    guide_cases, guide_case_doctors, status_history, hardware_orders,
    hardware_items, order_accessories, activity_log, app_settings
    RESTART IDENTITY CASCADE
  `);

  const stats = await seedDatabase();
  console.log("✓ Seed complete:", JSON.stringify(stats));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
