"use server";

import { db } from "@/db";
import * as t from "@/db/schema";
import { eq, and, sql, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./session";
import { ensureDb } from "@/db/bootstrap";
import { z } from "zod";
import * as v from "./validations";
import { hasAbility } from "./permissions";

export type ActionResult = { ok: true; id?: number; displayId?: string; message?: string } | { ok: false; error: string; message?: string };

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

async function logActivity(
  user: { id: number } | undefined | null,
  entityType: string,
  entityId: number | null,
  action: string,
  detail: string
) {
  if (!user) return;
  try {
    await db.insert(t.activityLog).values({ staffId: user.id, entityType, entityId, action, detail });
  } catch {
    // never fail an operation because of activity logging
  }
}

function refreshAll() {
  revalidatePath("/", "layout");
}

async function nextSeq(monthKey: string, kind: "guide" | "order"): Promise<number> {
  const q =
    kind === "guide"
      ? sql`select coalesce(max(seq_no), 0)::int as m from guide_cases where month_key = ${monthKey}`
      : sql`select coalesce(max(seq_no), 0)::int as m from hardware_orders where month_key = ${monthKey}`;
  const res = (await db.execute(q)) as unknown as { rows: { m: number }[] };
  return (res.rows[0]?.m ?? 0) + 1;
}

function monthKeyNow(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

async function resolveDoctor(name: string, area?: string | null, address?: string | null): Promise<number> {
  const trimmed = name.trim();
  const existing = await db.select().from(t.doctors).where(ilike(t.doctors.name, trimmed));
  let doctorId: number;
  if (existing.length) {
    doctorId = existing[0].id;
  } else {
    const [row] = await db.insert(t.doctors).values({ name: trimmed }).returning();
    doctorId = row.id;
  }
  if (area && area.trim()) {
    const clinics = await db
      .select()
      .from(t.doctorClinics)
      .where(and(eq(t.doctorClinics.doctorId, doctorId), ilike(t.doctorClinics.area, area.trim())));
    if (!clinics.length) {
      await db.insert(t.doctorClinics).values({
        doctorId,
        area: area.trim(),
        address: address?.trim() || null,
        isPrimary: existing.length === 0,
      });
    }
  }
  return doctorId;
}

// ---------------------------------------------------------------------------
// Doctor Management
// ---------------------------------------------------------------------------

export async function createDoctor(payload: z.infer<typeof v.doctorSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.doctorSchema.parse(payload);
    const doctorId = await resolveDoctor(data.name, data.area, data.address);
    await logActivity(user, "doctor", doctorId, "created", `Doctor ${data.name.trim()} added`);
    refreshAll();
    return { ok: true, id: doctorId };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add the doctor") };
  }
}

export async function updateDoctor(payload: z.infer<typeof v.updateDoctorSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.updateDoctorSchema.parse(payload);
    
    await db.update(t.doctors).set({ name: data.name.trim() }).where(eq(t.doctors.id, data.id));

    if (data.area && data.area.trim()) {
      const existingClinics = await db.select().from(t.doctorClinics).where(eq(t.doctorClinics.doctorId, data.id));
      if (existingClinics.length) {
        await db
          .update(t.doctorClinics)
          .set({ area: data.area.trim(), address: data.address?.trim() || null })
          .where(eq(t.doctorClinics.id, existingClinics[0].id));
      } else {
        await db.insert(t.doctorClinics).values({
          doctorId: data.id,
          area: data.area.trim(),
          address: data.address?.trim() || null,
          isPrimary: true,
        });
      }
    }
    await logActivity(user, "doctor", data.id, "updated", `Doctor ${data.name.trim()} updated`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update the doctor") };
  }
}

export async function deleteDoctor(payload: { id: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.idSchema.parse(payload);

    const casesCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(t.guideCases)
      .where(eq(t.guideCases.doctorId, data.id));
      
    if ((casesCount[0]?.count ?? 0) > 0) {
      return { ok: false, error: "Cannot delete doctor with active or historical cases. Reassign cases first." };
    }

    await db.delete(t.doctors).where(eq(t.doctors.id, data.id));
    await logActivity(user, "doctor", data.id, "deleted", `Doctor #${data.id} removed`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not delete the doctor") };
  }
}

// ---------------------------------------------------------------------------
// Patient Management
// ---------------------------------------------------------------------------

export async function createPatient(payload: z.infer<typeof v.patientSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.patientSchema.parse(payload);
    
    const [row] = await db
      .insert(t.patients)
      .values({
        doctorId: data.doctorId,
        name: data.name.trim(),
        notes: data.notes?.trim() || null,
      })
      .returning();
      
    await logActivity(user, "patient", row.id, "created", `Patient ${data.name.trim()} added`);
    refreshAll();
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add the patient") };
  }
}

export async function updatePatient(payload: z.infer<typeof v.updatePatientSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.updatePatientSchema.parse(payload);

    await db
      .update(t.patients)
      .set({
        doctorId: data.doctorId ? data.doctorId : undefined,
        name: data.name.trim(),
        notes: data.notes?.trim() || null,
      })
      .where(eq(t.patients.id, data.id));

    await logActivity(user, "patient", data.id, "updated", `Patient ${data.name.trim()} updated`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update the patient") };
  }
}

export async function deletePatient(payload: { id: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.idSchema.parse(payload);

    const casesCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(t.guideCases)
      .where(eq(t.guideCases.patientId, data.id));
      
    if ((casesCount[0]?.count ?? 0) > 0) {
      return { ok: false, error: "Cannot delete patient with existing guide cases or hardware orders." };
    }

    await db.delete(t.patients).where(eq(t.patients.id, data.id));
    await logActivity(user, "patient", data.id, "deleted", `Patient #${data.id} removed`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not delete the patient") };
  }
}

// ---------------------------------------------------------------------------
// Staff Management
// ---------------------------------------------------------------------------

export async function addStaff(payload: z.infer<typeof v.staffSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };

    const data = v.staffSchema.parse(payload);
    
    const rawInitials =
      data.initials?.trim() ||
      data.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const bcrypt = await import("bcryptjs");
    const passwordHash = data.password ? bcrypt.hashSync(data.password, 10) : null;

    const [newStaff] = await db
      .insert(t.staff)
      .values({
        name: data.name.trim(),
        username: data.username?.trim() || null,
        passwordHash,
        role: data.role || "planner",
        initials: rawInitials,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        abilities: data.abilities?.trim() || null,
        globalAccess: data.globalAccess !== undefined ? Boolean(data.globalAccess) : false,
        active: data.active !== undefined ? Boolean(data.active) : true,
      })
      .returning();

    await logActivity(user, "staff", newStaff.id, "created", `Staff ${data.name.trim()} added as ${data.role}`);
    refreshAll();
    return { ok: true, id: newStaff.id };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add staff") };
  }
}

export async function updateStaff(payload: z.infer<typeof v.updateStaffSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };

    const data = v.updateStaffSchema.parse(payload);

    const bcrypt = await import("bcryptjs");
    const updates: Partial<typeof t.staff.$inferInsert> = {
      name: data.name.trim(),
      role: data.role || undefined,
      username: data.username !== undefined ? (data.username?.trim() || null) : undefined,
      initials: data.initials?.trim() || undefined,
      email: data.email !== undefined ? (data.email?.trim() || null) : undefined,
      phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
      abilities: data.abilities !== undefined ? (data.abilities?.trim() || null) : undefined,
      globalAccess: data.globalAccess !== undefined ? Boolean(data.globalAccess) : undefined,
      active: data.active !== undefined ? Boolean(data.active) : undefined,
    };

    if (data.password && data.password.trim()) {
      updates.passwordHash = bcrypt.hashSync(data.password, 10);
    }

    await db
      .update(t.staff)
      .set(updates)
      .where(eq(t.staff.id, data.id));

    await logActivity(user, "staff", data.id, "updated", `Staff ${data.name.trim()} updated`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update staff") };
  }
}

export async function deleteStaff(payload: { id: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };

    const data = v.idSchema.parse(payload);

    const caseCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(t.guideCases)
      .where(eq(t.guideCases.plannerId, data.id));

    if ((caseCount[0]?.count ?? 0) > 0) {
      await db.update(t.staff).set({ active: false }).where(eq(t.staff.id, data.id));
      refreshAll();
      return {
        ok: true,
        message: "Member has historical cases assigned, so they were deactivated instead of permanently deleted.",
      };
    }

    await db.delete(t.staff).where(eq(t.staff.id, data.id));
    await logActivity(user, "staff", data.id, "deleted", `Staff #${data.id} removed`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not delete staff") };
  }
}

// ---------------------------------------------------------------------------
// Guide Cases
// ---------------------------------------------------------------------------

export async function createGuideCase(payload: z.infer<typeof v.guideCaseSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (!hasAbility(user?.abilities, "cases:create", user?.role)) {
      return { ok: false, error: "Unauthorized: You do not have permission to create cases." };
    }
    const data = v.guideCaseSchema.parse(payload);

    let docId = data.doctorId;
    if (!docId && data.newDoctorName) {
      docId = await resolveDoctor(data.newDoctorName, data.newDoctorArea);
    }
    if (!docId) return { ok: false, error: "Select or add a doctor" };

    let patId = data.patientId;
    if (!patId && data.newPatientName) {
      const [pRow] = await db
        .insert(t.patients)
        .values({
          doctorId: docId,
          name: data.newPatientName.trim(),
          notes: data.newPatientNotes?.trim() || null,
        })
        .returning();
      patId = pRow.id;
    }
    if (!patId) return { ok: false, error: "Select or add a patient" };

    const now = new Date();
    const mk = monthKeyNow();
    const seq = await nextSeq(mk, "guide");
    const [def] = await db.select().from(t.statuses).where(eq(t.statuses.isDefault, true)).limit(1);
    const defaultStatusId = def ? def.id : 1;

    const [row] = await db
      .insert(t.guideCases)
      .values({
        displayId: `G-${mk}-${String(seq).padStart(3, "0")}`,
        monthKey: mk,
        seqNo: seq,
        doctorId: docId,
        patientId: patId,
        caseTypeId: data.caseTypeId,
        systemId: data.systemId || null,
        sleeveId: data.sleeveId || null,
        plannerId: data.plannerId || null,
        statusId: defaultStatusId,
        teeth: data.teeth?.trim() || null,
        centre: data.centre?.trim() || null,
        address: data.address?.trim() || null,
        remarks: data.remarks?.trim() || null,
        kitNote: data.kitNote?.trim() || null,
        guideReport: data.guideReport?.trim() || null,
        stlReceived: Boolean(data.stlReceived),
        modelReceived: Boolean(data.modelReceived),
        physioDispenser: Boolean(data.physioDispenser),
        statusSince: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(t.statusHistory).values({
      caseId: row.id,
      fromStatusId: null,
      toStatusId: defaultStatusId,
      staffId: user?.id,
      remark: "Case created",
    });

    await logActivity(user, "guide_case", row.id, "created", `Case ${row.displayId} created`);
    refreshAll();
    return { ok: true, id: row.id, displayId: row.displayId };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not create case") };
  }
}

export async function updateGuideCase(payload: z.infer<typeof v.updateGuideCaseSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.updateGuideCaseSchema.parse(payload);

    const [kase] = await db.select().from(t.guideCases).where(eq(t.guideCases.id, data.caseId));
    if (!kase) return { ok: false, error: "Case not found" };

    if (user?.role !== "admin") {
      if (!hasAbility(user?.abilities, "cases:edit", user?.role)) {
        return { ok: false, error: "Unauthorized: You do not have permission to edit cases." };
      }
      if (user?.role === "planner" && kase.plannerId !== user.id) {
        return { ok: false, error: "Unauthorized: Planners can only edit cases assigned to them." };
      }
    }

    await db
      .update(t.guideCases)
      .set({
        doctorId: data.doctorId,
        patientId: data.patientId,
        caseTypeId: data.caseTypeId || undefined,
        systemId: data.systemId || null,
        sleeveId: data.sleeveId || null,
        plannerId: data.plannerId || null,
        teeth: data.teeth !== undefined ? (data.teeth?.trim() || null) : undefined,
        centre: data.centre !== undefined ? (data.centre?.trim() || null) : undefined,
        address: data.address !== undefined ? (data.address?.trim() || null) : undefined,
        remarks: data.remarks !== undefined ? (data.remarks?.trim() || null) : undefined,
        kitNote: data.kitNote !== undefined ? (data.kitNote?.trim() || null) : undefined,
        guideReport: data.guideReport !== undefined ? (data.guideReport?.trim() || null) : undefined,
        stlReceived: data.stlReceived !== undefined ? Boolean(data.stlReceived) : undefined,
        modelReceived: data.modelReceived !== undefined ? Boolean(data.modelReceived) : undefined,
        physioDispenser: data.physioDispenser !== undefined ? Boolean(data.physioDispenser) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(t.guideCases.id, data.caseId));

    await logActivity(user, "guide_case", data.caseId, "updated", "Case details updated");
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update case") };
  }
}

export async function deleteGuideCase(payload: { caseId: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (!hasAbility(user?.abilities, "cases:delete", user?.role)) {
      return { ok: false, error: "Unauthorized: You do not have permission to delete cases." };
    }
    const data = z.object({ caseId: z.number() }).parse(payload);

    await db
      .update(t.hardwareOrders)
      .set({ linkedCaseId: null })
      .where(eq(t.hardwareOrders.linkedCaseId, data.caseId));

    await db.delete(t.guideCases).where(eq(t.guideCases.id, data.caseId));
    await logActivity(user, "guide_case", data.caseId, "deleted", `Case #${data.caseId} deleted`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not delete case") };
  }
}

export async function moveCase(payload: z.infer<typeof v.moveCaseSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (!hasAbility(user?.abilities, "cases:status", user?.role)) {
      return { ok: false, error: "Unauthorized: You do not have permission to change case statuses." };
    }
    const data = v.moveCaseSchema.parse(payload);

    const [kase] = await db.select().from(t.guideCases).where(eq(t.guideCases.id, data.caseId));
    if (!kase) return { ok: false, error: "Case not found" };

    const [target] = await db.select().from(t.statuses).where(eq(t.statuses.key, data.statusKey));
    if (!target) return { ok: false, error: "Unknown status" };

    const [from] = await db.select().from(t.statuses).where(eq(t.statuses.id, kase.statusId));
    
    if (from?.kind === "terminal" && user?.role !== "admin") {
      return { ok: false, error: "Only an admin can reopen a delivered or cancelled case" };
    }
    
    if (kase.statusId !== target.id) {
      await db.transaction(async (tx) => {
        await tx
          .update(t.guideCases)
          .set({ statusId: target.id, statusSince: new Date(), updatedAt: new Date() })
          .where(eq(t.guideCases.id, data.caseId));
        await tx.insert(t.statusHistory).values({
          caseId: data.caseId,
          fromStatusId: kase.statusId,
          toStatusId: target.id,
          staffId: user?.id,
          remark: data.remark?.trim() ? data.remark.trim() : null,
        });
      });
      await logActivity(user, "guide_case", data.caseId, "status_changed", `${from?.name ?? "—"} → ${target.name}`);
    }
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not move case") };
  }
}

// ---------------------------------------------------------------------------
// Hardware Orders
// ---------------------------------------------------------------------------

export async function createHardwareOrder(payload: z.infer<typeof v.hardwareOrderSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.hardwareOrderSchema.parse(payload);

    let docId = data.doctorId;
    if (!docId && data.newDoctorName) {
      docId = await resolveDoctor(data.newDoctorName, data.newDoctorArea);
    }
    if (!docId) return { ok: false, error: "Select or add a doctor" };

    let patId = data.patientId;
    if (!patId && data.newPatientName) {
      const [pRow] = await db
        .insert(t.patients)
        .values({
          doctorId: docId,
          name: data.newPatientName.trim(),
          notes: data.newPatientNotes?.trim() || null,
        })
        .returning();
      patId = pRow.id;
    }
    if (!patId) return { ok: false, error: "Select or add a patient" };

    const now = new Date();
    const mk = monthKeyNow();
    const seq = await nextSeq(mk, "order");

    const [row] = await db
      .insert(t.hardwareOrders)
      .values({
        displayId: `O-${mk}-${String(seq).padStart(3, "0")}`,
        monthKey: mk,
        seqNo: seq,
        doctorId: docId,
        patientId: patId,
        packageTierId: data.tierId || null,
        orderDate: data.orderDate || now.toISOString().slice(0, 10),
        deliveryDate: data.deliveryDate || null,
        delivered: Boolean(data.delivered),
        remarks: data.remarks?.trim() || null,
        linkedCaseId: data.linkedCaseId || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (data.items && data.items.length) {
      await db.insert(t.hardwareItems).values(
        data.items.map((it, i) => ({
          orderId: row.id,
          systemId: it.systemId || null,
          size: it.size?.trim() || null,
          qty: it.qty || 1,
          coverScrewQty: it.coverScrewQty || it.cover || 0,
          physioQty: it.physioQty || it.physio || 0,
          failed: Boolean(it.failed),
          failNote: it.failNote?.trim() || null,
          sortOrder: i,
        }))
      );
    }

    if (data.accessories && data.accessories.length) {
      await db.insert(t.orderAccessories).values(
        data.accessories.map((a, i) => ({
          orderId: row.id,
          kind: a.kind || "other",
          detail: a.detail?.trim() || null,
          qty: a.qty || 1,
          note: a.note?.trim() || null,
          sortOrder: i,
        }))
      );
    }

    await logActivity(user, "hardware_order", row.id, "created", `Order ${row.displayId} created`);
    refreshAll();
    return { ok: true, id: row.id, displayId: row.displayId };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not create hardware order") };
  }
}

export async function updateHardwareOrder(payload: z.infer<typeof v.updateHardwareOrderSchema>): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = v.updateHardwareOrderSchema.parse(payload);

    const delivered = Boolean(data.delivered);
    const deliveryDate = data.deliveryDate || (delivered ? new Date().toISOString().slice(0, 10) : null);

    await db
      .update(t.hardwareOrders)
      .set({
        packageTierId: data.tierId || undefined,
        orderDate: data.orderDate || undefined,
        deliveryDate,
        delivered,
        remarks: data.remarks !== undefined ? (data.remarks?.trim() || null) : undefined,
        linkedCaseId: data.linkedCaseId || null,
        updatedAt: new Date(),
      })
      .where(eq(t.hardwareOrders.id, data.orderId));

    await logActivity(user, "hardware_order", data.orderId, "updated", "Order details updated");
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update hardware order") };
  }
}

export async function deleteHardwareOrder(payload: { orderId: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = z.object({ orderId: z.number() }).parse(payload);

    await db.delete(t.hardwareOrders).where(eq(t.hardwareOrders.id, data.orderId));
    await logActivity(user, "hardware_order", data.orderId, "deleted", `Order #${data.orderId} deleted`);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not delete order") };
  }
}

export async function markOrderDelivered(payload: { orderId: number; delivered: boolean }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = z.object({ orderId: z.number(), delivered: z.boolean() }).parse(payload);

    await db
      .update(t.hardwareOrders)
      .set({
        delivered: data.delivered,
        deliveryDate: data.delivered ? new Date().toISOString().slice(0, 10) : null,
        updatedAt: new Date(),
      })
      .where(eq(t.hardwareOrders.id, data.orderId));
      
    await logActivity(
      user,
      "hardware_order",
      data.orderId,
      data.delivered ? "delivered" : "unmarked_delivered",
      data.delivered ? "Marked as delivered" : "Delivery status reopened"
    );
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not mark order delivered") };
  }
}

export async function setItemFailure(payload: { itemId: number; failed: boolean; note?: string | null }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    const data = z.object({ itemId: z.number(), failed: z.boolean(), note: z.string().optional().nullable() }).parse(payload);

    const [item] = await db.select().from(t.hardwareItems).where(eq(t.hardwareItems.id, data.itemId));
    if (!item) return { ok: false, error: "Item not found" };
    
    await db
      .update(t.hardwareItems)
      .set({
        failed: data.failed,
        failNote: data.failed ? (data.note?.trim() ? data.note.trim() : item.failNote ?? "Failed implant") : null,
      })
      .where(eq(t.hardwareItems.id, data.itemId));
      
    await logActivity(
      user,
      "hardware_order",
      item.orderId,
      data.failed ? "item_failed" : "item_unfailed",
      data.failed ? `Item #${data.itemId} marked failed` : `Item #${data.itemId} failure cleared`
    );
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not set item failure") };
  }
}

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

export async function toggleCatalogActive(payload: { kind: string; id: number }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };
    
    const data = z.object({ kind: z.string(), id: z.number() }).parse(payload);

    if (data.kind === "systems") {
      const [r] = await db.select().from(t.implantSystems).where(eq(t.implantSystems.id, data.id));
      if (r) await db.update(t.implantSystems).set({ active: !r.active }).where(eq(t.implantSystems.id, data.id));
    } else if (data.kind === "sleeves") {
      const [r] = await db.select().from(t.sleeveKits).where(eq(t.sleeveKits.id, data.id));
      if (r) await db.update(t.sleeveKits).set({ active: !r.active }).where(eq(t.sleeveKits.id, data.id));
    } else if (data.kind === "types") {
      const [r] = await db.select().from(t.caseTypes).where(eq(t.caseTypes.id, data.id));
      if (r) await db.update(t.caseTypes).set({ active: !r.active }).where(eq(t.caseTypes.id, data.id));
    } else if (data.kind === "tiers") {
      const [r] = await db.select().from(t.packageTiers).where(eq(t.packageTiers.id, data.id));
      if (r) await db.update(t.packageTiers).set({ active: !r.active }).where(eq(t.packageTiers.id, data.id));
    } else if (data.kind === "staff") {
      const [r] = await db.select().from(t.staff).where(eq(t.staff.id, data.id));
      if (r) await db.update(t.staff).set({ active: !r.active }).where(eq(t.staff.id, data.id));
    }
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not toggle catalog") };
  }
}

export async function setSleeveCompat(payload: { sleeveId: number; systemId: number; enabled: boolean }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };

    const data = z.object({ sleeveId: z.number(), systemId: z.number(), enabled: z.boolean() }).parse(payload);

    if (data.enabled) {
      await db.insert(t.sleeveCompat).values({ sleeveId: data.sleeveId, systemId: data.systemId }).onConflictDoNothing();
    } else {
      await db
        .delete(t.sleeveCompat)
        .where(and(eq(t.sleeveCompat.sleeveId, data.sleeveId), eq(t.sleeveCompat.systemId, data.systemId)));
    }
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not set sleeve compatibility") };
  }
}

export async function updateSetting(payload: { key: string; value: string }): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };
    
    const data = z.object({ key: z.string(), value: z.string() }).parse(payload);

    await db
      .insert(t.appSettings)
      .values({ key: data.key, value: data.value })
      .onConflictDoUpdate({ target: t.appSettings.key, set: { value: data.value, updatedAt: new Date() } });
      
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not update setting") };
  }
}

export async function addCatalogEntry(kind: string, formData: FormData): Promise<ActionResult> {
  try {
    await ensureDb();
    const user = await getCurrentUser();
    if (user?.role !== "admin") return { ok: false, error: "Unauthorized" };

    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Name is required" };

    if (kind === "systems") {
      await db.insert(t.implantSystems).values({ name, active: true });
    } else if (kind === "sleeves") {
      await db.insert(t.sleeveKits).values({ name, active: true });
    } else if (kind === "types") {
      const formCode = String(formData.get("code") || "").trim();
      const code = formCode || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await db.insert(t.caseTypes).values({ code, name, active: true });
    } else if (kind === "tiers") {
      await db.insert(t.packageTiers).values({ name, active: true });
    } else if (kind === "statuses") {
      const color = String(formData.get("color") || "#8b8f98").trim();
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const existing = await db.select().from(t.statuses);
      const sortOrder = existing.length > 0 ? Math.max(...existing.map(s => s.sortOrder)) + 1 : 1;
      await db.insert(t.statuses).values({ name, key, color, kind: "in_progress", sortOrder });
    } else if (kind === "staff") {
      const role = String(formData.get("role") || "planner").trim();
      const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      const username = name.toLowerCase().replace(/\s/g, "");
      const bcrypt = await import("bcryptjs");
      const passwordHash = bcrypt.hashSync("pass", 10);
      await db.insert(t.staff).values({ name, username, passwordHash, initials, role, active: true });
    } else {
      return { ok: false, error: "Unknown kind" };
    }

    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add entry") };
  }
}

export async function updateThreshold(formData: FormData): Promise<ActionResult> {
  const days = Number(formData.get("value") || 0);
  if (days <= 0) return { ok: false, error: "Invalid days" };
  return updateSetting({ key: "stuck_threshold_days", value: String(days) });
}

export async function updateLabName(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("value") || "").trim();
  if (!name) return { ok: false, error: "Name is required" };
  return updateSetting({ key: "lab_name", value: name });
}

