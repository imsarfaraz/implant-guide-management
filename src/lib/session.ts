import { cookies } from "next/headers";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db/bootstrap";
import { SignJWT, jwtVerify } from "jose";

export type CurrentUser = {
  id: number;
  name: string;
  username: string | null;
  role: string;
  abilities: string | null;
  globalAccess: boolean;
  initials: string | null;
  active: boolean;
  createdAt: Date;
};

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-local-dev-only"
);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await ensureDb();
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  
  if (!token) {
    return null; // Return null if not authenticated
  }

  const payload = await decrypt(token);
  if (!payload || typeof payload.userId !== "number") {
    return null;
  }

  const rows = await db.select().from(staff).where(eq(staff.id, payload.userId));
  if (rows.length && rows[0].active) {
    return rows[0];
  }
  
  return null;
}

export async function isAdmin(): Promise<boolean> {
  const u = await getCurrentUser();
  return u?.role === "admin";
}
