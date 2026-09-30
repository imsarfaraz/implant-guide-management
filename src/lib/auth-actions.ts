"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getCurrentUser, encrypt } from "./session";
import * as v from "./validations";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  const users = await db.select().from(staff).where(eq(staff.username, username));
  const user = users[0];

  if (!user || !user.active) {
    return { error: "Invalid credentials or inactive account" };
  }

  const isValidPassword = user.passwordHash 
    ? bcrypt.compareSync(password, user.passwordHash)
    : false;

  if (!isValidPassword) {
    return { error: "Invalid credentials" };
  }

  // Generate JWT token
  const token = await encrypt({ userId: user.id, role: user.role });
  
  // Set cookie
  const jar = await cookies();
  jar.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  const jar = await cookies();
  jar.delete("auth_token");
  redirect("/login");
}

export async function changePassword(payload: z.infer<typeof v.changePasswordSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const data = v.changePasswordSchema.parse(payload);

    const [dbUser] = await db.select().from(staff).where(eq(staff.id, user.id));
    if (!dbUser || !dbUser.passwordHash) {
      return { ok: false, error: "Invalid user state" };
    }

    const isValid = bcrypt.compareSync(data.currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return { ok: false, error: "Incorrect current password" };
    }

    const newHash = bcrypt.hashSync(data.newPassword, 10);
    await db.update(staff).set({ passwordHash: newHash }).where(eq(staff.id, user.id));

    return { ok: true };
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to change password" };
  }
}

export async function updateProfileName(payload: { name: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    if (!payload.name || payload.name.trim().length < 2) {
      return { ok: false, error: "Name must be at least 2 characters" };
    }

    await db.update(staff).set({ name: payload.name.trim() }).where(eq(staff.id, user.id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to update profile name" };
  }
}
