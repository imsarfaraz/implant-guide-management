import { db } from "./src/db";
import { staff } from "./src/db/schema";
import { ensureDb } from "./src/db/bootstrap";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function run() {
  await ensureDb();
  const allStaff = await db.select().from(staff);
  for (const s of allStaff) {
    let username = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s.role === "admin") username = "admin";
    if (s.name === "Zainab Mistry") username = "planner1";
    if (s.name === "Vinayak Rao") username = "planner2";
    if (s.name === "Sanjeevini Patil") username = "planner3";
    if (s.name === "Tanupriya Das") username = "planner4";
    if (s.name === "Meera Iyer") username = "frontdesk1";
    
    await db.update(staff).set({
      username: username,
      passwordHash: bcrypt.hashSync("pass", 10)
    }).where(eq(staff.id, s.id));
  }
  console.log("Updated passwords!");
  process.exit(0);
}
run();
