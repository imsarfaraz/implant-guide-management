import { desc } from "drizzle-orm";
import { db } from "./index";
import * as t from "./schema";
import bcrypt from "bcryptjs";

// Deterministic PRNG so the demo dataset is stable across reseeds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let a = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260214);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
function wPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000);

const STATUS_DEF: [string, string, string, number, string, boolean][] = [
  ["to_check", "TO CHECK", "stage", 10, "#64748b", true],
  ["to_approve", "TO APPROVE", "stage", 20, "#d97706", false],
  ["planning", "PLANNING", "stage", 30, "#2563eb", false],
  ["to_modify", "TO MODIFY", "stage", 40, "#7c3aed", false],
  ["replan", "REPLAN", "stage", 45, "#9333ea", false],
  ["to_print", "TO PRINT", "stage", 50, "#0891b2", false],
  ["to_dispatch", "TO DISPATCH", "stage", 60, "#0d9488", false],
  ["delivered", "DELIVERED", "terminal", 70, "#16a34a", false],
  ["on_hold", "ON HOLD", "hold", 25, "#dc2626", false],
  ["follow_up", "FOLLOW UP", "hold", 35, "#ea580c", false],
  ["cancelled", "CANCELLED", "terminal", 90, "#475569", false],
];
const CHAINS: Record<string, string[]> = {
  to_check: ["to_check"],
  to_approve: ["to_check", "to_approve"],
  planning: ["to_check", "to_approve", "planning"],
  to_modify: ["to_check", "to_approve", "planning", "to_modify"],
  replan: ["to_check", "to_approve", "planning", "replan"],
  to_print: ["to_check", "to_approve", "planning", "to_print"],
  to_dispatch: ["to_check", "to_approve", "planning", "to_print", "to_dispatch"],
  delivered: ["to_check", "to_approve", "planning", "to_print", "to_dispatch", "delivered"],
  on_hold: ["to_check", "to_approve", "on_hold"],
  follow_up: ["to_check", "to_approve", "planning", "follow_up"],
  cancelled: ["to_check", "to_approve", "cancelled"],
};

const STAFF: [string, string, string, string, string, string, string][] = [
  [
    "Sanket Kulkarni",
    "admin",
    "admin",
    "SK",
    "sanket@mumbaisurgicalguide.com",
    "+91 98201 11223",
    "cases:create,cases:edit,cases:plan,cases:status,cases:delete,orders:create,orders:edit,orders:deliver,orders:delete,catalog:manage,team:manage,reports:view",
  ],
  [
    "Zainab Mistry",
    "planner1",
    "planner",
    "ZM",
    "zainab.m@mumbaisurgicalguide.com",
    "+91 98202 33445",
    "cases:create,cases:edit,cases:plan,cases:status,orders:create,orders:edit,reports:view",
  ],
  [
    "Vinayak Rao",
    "planner2",
    "planner",
    "VR",
    "vinayak.r@mumbaisurgicalguide.com",
    "+91 98203 44556",
    "cases:create,cases:edit,cases:plan,cases:status,orders:create,orders:edit,reports:view",
  ],
  [
    "Sanjeevini Patil",
    "planner3",
    "planner",
    "SP",
    "sanjeevini.p@mumbaisurgicalguide.com",
    "+91 98204 55667",
    "cases:create,cases:edit,cases:plan,cases:status,orders:create,orders:edit,reports:view",
  ],
  [
    "Tanupriya Das",
    "planner4",
    "planner",
    "TD",
    "tanupriya.d@mumbaisurgicalguide.com",
    "+91 98205 66778",
    "cases:create,cases:edit,cases:plan,cases:status,orders:create,orders:edit,reports:view",
  ],
  [
    "Meera Iyer",
    "frontdesk1",
    "frontdesk",
    "MI",
    "frontdesk@mumbaisurgicalguide.com",
    "+91 98206 77889",
    "cases:create,cases:edit,cases:status,orders:create,orders:edit,orders:deliver",
  ],
];

const DOCTORS: [string, [string, string][]][] = [
  ["Dr. Sanket Shah", [["Mulund", "Shop 4, Silver Plaza, MG Road"], ["Thane", "G-2, Highlands, Ghodbunder Road"]]],
  ["Dr. Ayushi Patel", [["Malad", "201, Sunshine Tower, Link Road"]]],
  ["Dr. Rahul Mehta", [["Kharghar", "B-12, Sector 7, near station"]]],
  ["Dr. Priya Nair", [["Vile Parle", "3, Panchvati, SV Road"], ["Khar", "5A, Khar West Market"]]],
  ["Dr. Amit Patil", [["Bhiwandi", "14, Kalyan-Bhiwandi Road"]]],
  ["Dr. Neha Kulkarni", [["Andheri", "704, Trade Star, JB Nagar"], ["Vile Parle", "Panchvati Annexe, SV Road"]]],
  ["Dr. Kunal Verma", [["Kalyan", "2nd Floor, Shreeji Arcade"]]],
  ["Dr. Ritu Desai", [["Prabhadevi", "Veena Beena Arcade, GD Ambedkar Marg"]]],
  ["Dr. Farhan Sheikh", [["Santacruz", "B-5, Milan Mall, SV Road"], ["Bandra", "12, Waterfield Road"]]],
  ["Dr. Anita Rao", [["Ghatkopar", "11, Rajiv Gandhi Nagar"]]],
  ["Dr. Vikram Singh", [["Boisar", "G-1, Boisar Industrial Estate"]]],
  ["Dr. Pooja Mehta", [["Khar", "22, Khar Danda Market"]]],
  ["Dr. Manish Gupta", [["New Delhi", "C-8, Greater Kailash II"]]],
  ["Dr. Sneha Joshi", [["Mumbai Central", "Nair Hospital, 2nd Floor"]]],
  ["Dr. Rohan Bhatt", [["Ghatkopar", "3, Amrut Nagar Circle"]]],
  ["Dr. Kavita Menon", [["Chembur", "12-B, Diamond Garden"]]],
  ["Dr. Imran Qureshi", [["Kurla", "Shop 9, LBS Marg"]]],
  ["Dr. Deepa Shetty", [["Vashi", "Sector 17, Tower 4"]]],
];

const SYSTEMS = [
  "Osstem", "Neodent", "Neodent GM Aqua", "Alfagate", "Alfagate Max",
  "Alfagate Porus", "Straumann BLC", "Straumann BLT SLA", "Neobiotech", "Biotem",
  "AB Dental", "Nobel Biocare", "Dentium", "Bredent (Copa Sky)", "Zimvie",
  "Quickdent", "Megagen", "Dio", "Adin", "Nebula", "Biohorizon", "Cowell",
  "Mis Lance", "Kontact", "Noris", "Southern",
];
const SYSTEM_W = [18, 11, 3, 10, 3, 1, 8, 7, 6, 6, 4, 5, 5, 2, 4, 4, 3, 3, 2, 1, 2, 1, 2, 1, 1, 1];

const SLEEVES: [string, string[]][] = [
  ["OSSTEM SLEEVELESS", ["Osstem"]],
  ["STRAUMANN SLEEVE", ["Straumann BLC", "Straumann BLT SLA", "Neobiotech"]],
  ["NEODENT SLEEVE", ["Neodent", "Neodent GM Aqua"]],
  ["ALFAGATE KIT", ["Alfagate", "Alfagate Max", "Alfagate Porus"]],
  ["UNIVERSAL PILOT SLEEVE", SYSTEMS],
  ["STANDARD 2.1MM SLEEVE", ["Osstem", "Neodent", "Dentium", "Dio", "Adin", "Cowell"]],
  ["GUIDED SLEEVE 5.0MM", ["Nobel Biocare", "AB Dental", "Zimvie", "Biohorizon"]],
  ["BIO GUIDE SLEEVE", ["Biotem", "Megagen", "Bredent (Copa Sky)", "Quickdent", "Nebula"]],
];

const CASE_TYPES: [string, string, number, number][] = [
  ["GUIDE", "Surgical Guide", 10, 40],
  ["PACKAGE", "Guide + Implant Package", 20, 16],
  ["PILOT_GUIDE", "Pilot Guide", 30, 9],
  ["PILOT_21", "Pilot Guide (2.1mm)", 40, 4],
  ["PLAN_ONLY", "Plan Only", 50, 6],
  ["PLANNING", "Planning", 60, 3],
  ["REPLAN", "Replan", 70, 4],
  ["MODEL", "3D Model", 80, 4],
  ["WORKSHOP", "Workshop Case", 90, 2],
  ["ENDO_GUIDE", "Endo Guide", 100, 3],
  ["FREE_HAND", "Free Hand (Package)", 110, 6],
  ["PKG_BIOTEM", "Pkg Biotem", 120, 3],
];

const TIERS = ["BASIC", "ADVANCE", "ADVANCE+"];

const FIRST = ["Aarav","Diya","Rohan","Sneha","Kabir","Ananya","Vihaan","Myra","Arjun","Aisha","Ishaan","Tara","Aditya","Nisha","Dev","Kavya","Reyansh","Sara","Vivaan","Priya","Rudra","Meera","Shaurya","Ira","Aryan","Riya","Krish","Anika","Veer","Zoya","Arnav","Lavanya","Yash","Naina","Karan","Pooja","Rahul","Sana","Mohit","Divya","Nikhil","Simran","Amit","Neha","Rakesh","Pallavi","Suresh","Urmila","Gaurav","Shreya","Tushar","Vaishali"];
const LAST = ["Sharma","Patel","Kulkarni","Iyer","Mehta","Desai","Gupta","Nair","Reddy","Khan","Joshi","Menon","Verma","Pillai","Rao","Singh","Shah","Malhotra","Bose","Fernandes","Shetty","Naik"];
const PATIENT_NOTES = ["maxilla", "mandible", "off emp — staff family", "old patient, 3rd case", "ALL ON 4 candidate", "smile makeover", "diabetic — note for surgery", "relative of clinic manager", "referred by existing patient", "emergency — pain case"];

const TEETH = [
  "15 to 25", "46 & 47", "36", "11, 21", "ALL ON 4 - MAXILLA", "ALL ON 6 - MANDIBLE",
  "24, 25, 26", "14, 16, 17", "45", "31, 32, 41, 42", "26 & 27", "11 - 22",
  "37", "12, 13, 14, 15", "41 to 44", "21, 22, 23", "44 & 45", "16, 17, 26, 27",
  "ALL ON 4 - MANDIBLE", "34, 35, 36", "27", "43, 44", "13, 23",
];

const CASE_REMARKS = [
  "Doctor approved over WhatsApp call",
  "STL received 2 days late — flagged",
  "Emergency case, expedited printing",
  "Sleeve kit to be returned with case",
  "Awaiting CBCT from clinic",
  "Model sent by courier, track delivery",
  "Doctor prefers closed tray approach",
  "Replan requested — angulation changed",
  "Patient is staff (off emp)",
  "Workshop training case — observe",
  "FDI map reconfirmed with clinic",
  "Guide report sent by email",
  "Billing under package tier ADVANCE",
  "Reusing previous model — no new scan",
  "", "", "", "", "",
];

const KIT_NOTES = ["Kit to return with case", "Pilot kit sent separately", "Use lab kit — clinic has none", "Kit exchanged with previous case", "", "", "", ""];

const FAIL_NOTES = [
  "1 fail remaining",
  "failed at placement — replacement owed",
  "fixture failed at site 46",
  "2 implants failed, redo scheduled",
  "failed after 2 weeks, replacement dispatched",
  "failed — osseointegration issue",
];

const ACCESSORY_DETAIL: Record<string, string[]> = {
  healing_cap: ["standard", "wide", "standard x2"],
  abutment: ["straight", "17 degree", "multi-unit 30deg", "angled 15deg", "cement-retained"],
  cover_screw: ["standard"],
  prosthetic_screw: ["standard", "long"],
  physio: ["standard", "mini"],
  other: ["as discussed"],
};

const HOLD_REMARKS = [
  "Awaiting doctor approval on plan",
  "Patient rescheduled — on hold",
  "Clinic requested delay",
  "Payment pending, case held",
  "Follow up in 2 days",
  "Doctor out of town",
];

export async function seedDatabase() {
  // -- Staff ---------------------------------------------------------------
  const defaultPassword = bcrypt.hashSync("pass", 10);
  const staffRows = await db.insert(t.staff).values(
    STAFF.map(([name, username, role, initials, email, phone, abilities]) => ({
      name,
      username,
      passwordHash: defaultPassword,
      role,
      initials,
      email,
      phone,
      abilities,
    }))
  ).returning();
  const planners = staffRows.filter((s) => s.role === "planner" || s.role === "admin");
  const defaultUser = staffRows[0];

  // -- Doctors & clinics ----------------------------------------------------
  const doctorRows = await db.insert(t.doctors)
    .values(DOCTORS.map(([name]) => ({ name })))
    .returning();
  const doctorByName = new Map(doctorRows.map((d) => [d.name, d]));
  for (const [name, clinics] of DOCTORS) {
    const d = doctorByName.get(name)!;
    await db.insert(t.doctorClinics).values(
      clinics.map(([area, address], i) => ({
        doctorId: d.id, area, address, isPrimary: i === 0,
      }))
    );
  }

  // -- Patients --------------------------------------------------------------
  const patients: { name: string; doctorId: number; notes: string | null }[] = [];
  DOCTORS.forEach((_, i) => {
    const n = 4 + Math.floor(rnd() * 4); // 4-7 patients per doctor
    for (let k = 0; k < n; k++) {
      patients.push({
        name: `${pick(FIRST)} ${pick(LAST)}`,
        doctorId: doctorRows[i].id,
        notes: rnd() < 0.22 ? pick(PATIENT_NOTES) : null,
      });
    }
  });
  const patientRows = await db.insert(t.patients).values(patients).returning();
  const patientsByDoctor = new Map<number, typeof patientRows>();
  for (const p of patientRows) {
    const arr = patientsByDoctor.get(p.doctorId) ?? [];
    arr.push(p);
    patientsByDoctor.set(p.doctorId, arr);
  }

  // -- Catalogs ---------------------------------------------------------------
  const systemRows = await db.insert(t.implantSystems)
    .values(SYSTEMS.map((name) => ({ name })))
    .returning();
  const systemId = (name: string) => systemRows.find((s) => s.name === name)!.id;

  const sleeveRows = await db.insert(t.sleeveKits)
    .values(SLEEVES.map(([name]) => ({ name })))
    .returning();
  const compatRows = SLEEVES.flatMap(([sleeveName, systems]) => {
    const sleeve = sleeveRows.find((s) => s.name === sleeveName)!;
    return systems.map((sysName) => ({
      sleeveId: sleeve.id,
      systemId: systemId(sysName),
    }));
  });
  await db.insert(t.sleeveCompat).values(compatRows);
  const sleevesFor = (systemName: string) =>
    SLEEVES.map(([n, sys], i) => ({ n, sys, id: sleeveRows[i].id }))
      .filter((s) => s.sys.includes(systemName));

  await db.insert(t.caseTypes).values(
    CASE_TYPES.map(([code, name, sortOrder]) => ({ code, name, sortOrder }))
  );
  const typeRows = await db.select().from(t.caseTypes);
  const typeId = (code: string) => typeRows.find((x) => x.code === code)!.id;

  await db.insert(t.statuses).values(
    STATUS_DEF.map(([key, name, kind, sortOrder, color, isDefault]) => ({
      key, name, kind, sortOrder, color, isDefault,
    }))
  );
  const statusRows = await db.select().from(t.statuses);
  const statusId = (key: string) => statusRows.find((s) => s.key === key)!.id;

  await db.insert(t.packageTiers).values(
    TIERS.map((name, i) => ({ name, sortOrder: (i + 1) * 10 }))
  );
  const tierRows = await db.select().from(t.packageTiers);

  // -- Guide cases -------------------------------------------------------------
  interface GRow {
    displayId: string; monthKey: string; seqNo: number;
    doctorId: number; patientId: number; caseTypeId: number;
    systemId: number; sleeveId: number; plannerId: number | null;
    statusId: number; teeth: string; centre: string; address: string;
    remarks: string | null; stlReceived: boolean; modelReceived: boolean;
    guideReport: string | null; kitNote: string | null; physioDispenser: boolean;
    statusSince: Date; createdAt: Date;
    history: { from: number | null; to: number; staffId: number; remark: string | null; at: Date }[];
  }
  const cases: GRow[] = [];
  const PLAN: [string, number][] = [
    ["delivered", 110], ["to_check", 14], ["to_approve", 16], ["planning", 14],
    ["to_modify", 7], ["replan", 4], ["to_print", 8], ["to_dispatch", 6],
    ["on_hold", 6], ["follow_up", 4], ["cancelled", 4],
  ];
  const stuckQuota: Record<string, number> = { to_approve: 3, on_hold: 3, follow_up: 2, planning: 2 };

  const buildTimes = (nTransitions: number, created: Date, since: Date): Date[] => {
    if (nTransitions <= 0) return [];
    const span = since.getTime() - created.getTime();
    if (span <= 0) return Array.from({ length: nTransitions }, () => since);
    const out: Date[] = [];
    for (let i = 1; i <= nTransitions; i++) {
      if (i === nTransitions) out.push(since);
      else out.push(new Date(created.getTime() + (span * i) / nTransitions * (0.8 + rnd() * 0.4)));
    }
    for (let i = 1; i < out.length; i++) {
      if (out[i].getTime() <= out[i - 1].getTime()) out[i] = new Date(out[i - 1].getTime() + 3600_000);
    }
    if (out.length && out[out.length - 1].getTime() > since.getTime()) out[out.length - 1] = since;
    return out;
  };

  for (const [statusKey, count] of PLAN) {
    const isTerminal = STATUS_DEF.find((s) => s[0] === statusKey)![2] === "terminal";
    const chain = CHAINS[statusKey];
    let stuckLeft = stuckQuota[statusKey] ?? 0;

    for (let i = 0; i < count; i++) {
      const stuck = stuckLeft > 0 && !isTerminal;
      if (stuck) stuckLeft--;

      let created: Date; let since: Date;
      if (isTerminal) {
        created = daysAgo(10 + rnd() * 330);
        since = new Date(created.getTime() + (2 + rnd() * 12) * 86400_000);
      } else if (stuck) {
        since = daysAgo(5 + rnd() * 14);
        created = new Date(since.getTime() - (chain.length * 0.8 + rnd() * 3) * 86400_000);
      } else {
        since = daysAgo(rnd() * 4);
        created = new Date(Math.min(daysAgo(rnd() * 40).getTime(), since.getTime() - chain.length * 3600_000 * 5));
      }

      const docIdx = Math.floor(rnd() * DOCTORS.length);
      const doctor = doctorRows[docIdx];
      const clinics = DOCTORS[docIdx][1];
      const [centre, address] = pick(clinics);
      const patient = pick(patientsByDoctor.get(doctor.id)!);
      const systemName = wPick(SYSTEMS, SYSTEM_W);
      const compatible = sleevesFor(systemName);
      const sleeve = pick(compatible);
      const typeCode = wPick(CASE_TYPES.map((c) => c[0]), CASE_TYPES.map((c) => c[3]));
      const unassigned = statusKey === "to_check" && rnd() < 0.4;
      const planner = unassigned ? null : pick(planners);

      const transTimes = buildTimes(chain.length - 1, created, since);
      const history: GRow["history"] = [];
      chain.forEach((toKey, idx) => {
        if (idx === 0) return;
        void toKey;
        const toK = chain[idx];
        const at = transTimes[idx - 1];
        const isHoldLike = ["on_hold", "follow_up", "cancelled"].includes(toK);
        history.push({
          from: statusId(chain[idx - 1]),
          to: statusId(toK),
          staffId: pick(planners).id,
          remark: isHoldLike ? pick(HOLD_REMARKS) : rnd() < 0.08 ? "Plan discussed with doctor" : null,
          at,
        });
      });

      cases.push({
        displayId: "", monthKey: "", seqNo: 0,
        doctorId: doctor.id, patientId: patient.id, caseTypeId: typeId(typeCode),
        systemId: systemId(systemName), sleeveId: sleeve.id,
        plannerId: planner ? planner.id : null,
        statusId: statusId(statusKey),
        teeth: pick(TEETH),
        centre, address,
        remarks: pick(CASE_REMARKS),
        stlReceived: rnd() < 0.85,
        modelReceived: rnd() < 0.3,
        guideReport: rnd() < 0.15 ? "sent by email" : null,
        kitNote: pick(KIT_NOTES),
        physioDispenser: rnd() < 0.15,
        statusSince: since,
        createdAt: created,
        history,
      });
    }
  }

  cases.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const monthCounters = new Map<string, number>();
  for (const c of cases) {
    const mk = monthKey(c.createdAt);
    const n = (monthCounters.get(mk) ?? 0) + 1;
    monthCounters.set(mk, n);
    c.monthKey = mk;
    c.seqNo = n;
    c.displayId = `G-${mk}-${String(n).padStart(3, "0")}`;
  }

  const insertedCases = await db.insert(t.guideCases).values(
    cases.map(({ history: _h, ...rest }) => rest)
  ).returning();

  await db.insert(t.statusHistory).values(
    insertedCases.flatMap((row, i) =>
      cases[i].history.map((h) => ({
        caseId: row.id, fromStatusId: h.from, toStatusId: h.to,
        staffId: h.staffId, remark: h.remark, createdAt: h.at,
      }))
    )
  );

  // Two joint cases (two doctors on one case)
  const jointCandidates = insertedCases.filter((c) => c.statusId === statusId("planning")).slice(0, 2);
  for (const joint of jointCandidates) {
    const otherDoctor = doctorRows.find((d) => d.id !== joint.doctorId)!;
    await db.insert(t.guideCaseDoctors)
      .values([{ caseId: joint.id, doctorId: joint.doctorId }, { caseId: joint.id, doctorId: otherDoctor.id }])
      .onConflictDoNothing();
  }

  const casesByPatient = new Map<number, typeof insertedCases>();
  for (const c of insertedCases) {
    const arr = casesByPatient.get(c.patientId) ?? [];
    arr.push(c);
    casesByPatient.set(c.patientId, arr);
  }

  // -- Hardware orders ----------------------------------------------------------
  interface ORow {
    displayId: string; monthKey: string; seqNo: number;
    doctorId: number; patientId: number; packageTierId: number;
    orderDate: string; deliveryDate: string | null; delivered: boolean;
    remarks: string | null; linkedCaseId: number | null; createdAt: Date;
    items: { systemId: number; size: string; qty: number; coverScrewQty: number; physioQty: number; failed: boolean; failNote: string | null; sortOrder: number }[];
    accessories: { kind: string; detail: string | null; qty: number; note: string | null; sortOrder: number }[];
  }
  const orders: ORow[] = [];
  const SIZES = ["4/8", "3.5/11.5", "4.5/10", "3.5/8.5", "5/8.5", "4/10", "3.3/10", "3.75/11.5", "4/11.5", "5/13", "4.1/10", "3.5/13", "4.5/13", "6/10"];
  const ACC_KINDS = ["healing_cap", "abutment", "cover_screw", "prosthetic_screw", "physio"];
  const ACC_W = [3, 3.5, 1.5, 1.5, 1];

  for (let i = 0; i < 140; i++) {
    const docIdx = Math.floor(rnd() * DOCTORS.length);
    const doctor = doctorRows[docIdx];
    const patient = pick(patientsByDoctor.get(doctor.id)!);
    const created = daysAgo(rnd() * 340);
    const r = rnd();
    let delivered = false;
    let deliveryDate: string | null = null;
    let remarks: string | null = null;
    if (r < 0.68) {
      delivered = true;
      deliveryDate = fmtDate(new Date(created.getTime() + (1 + Math.floor(rnd() * 6)) * 86400_000));
    } else if (r < 0.86) {
      remarks = "Awaiting dispatch confirmation";
    } else {
      remarks = "Delivery date TBC — confirm with clinic";
    }

    const items: ORow["items"] = [];
    const nItems = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < nItems; k++) {
      const failed = rnd() < 0.13;
      items.push({
        systemId: systemId(wPick(SYSTEMS, SYSTEM_W)),
        size: pick(SIZES),
        qty: rnd() < 0.6 ? 1 + Math.floor(rnd() * 2) : 3 + Math.floor(rnd() * 2),
        coverScrewQty: rnd() < 0.5 ? 1 + Math.floor(rnd() * 2) : 0,
        physioQty: rnd() < 0.12 ? 1 : 0,
        failed,
        failNote: failed ? pick(FAIL_NOTES) : null,
        sortOrder: k,
      });
    }

    const accessories: ORow["accessories"] = [];
    const nAcc = Math.floor(rnd() * 4);
    for (let k = 0; k < nAcc; k++) {
      const kind = wPick(ACC_KINDS, ACC_W);
      accessories.push({
        kind,
        detail: pick(ACCESSORY_DETAIL[kind]),
        qty: 1 + Math.floor(rnd() * 2),
        note: rnd() < 0.15 ? pick(HOLD_REMARKS) : null,
        sortOrder: k,
      });
    }

    let linkedCaseId: number | null = null;
    if (rnd() < 0.35) {
      const myCases = (casesByPatient.get(patient.id) ?? [])
        .filter((c) => c.createdAt.getTime() <= created.getTime() + 86400_000);
      if (myCases.length) linkedCaseId = myCases[myCases.length - 1].id;
    }

    orders.push({
      displayId: "", monthKey: "", seqNo: 0,
      doctorId: doctor.id, patientId: patient.id,
      packageTierId: pick(tierRows).id,
      orderDate: fmtDate(created), deliveryDate, delivered,
      remarks, linkedCaseId, createdAt: created,
      items, accessories,
    });
  }

  orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const orderMonth = new Map<string, number>();
  for (const o of orders) {
    const mk = monthKey(o.createdAt);
    const n = (orderMonth.get(mk) ?? 0) + 1;
    orderMonth.set(mk, n);
    o.monthKey = mk;
    o.seqNo = n;
    o.displayId = `O-${mk}-${String(n).padStart(3, "0")}`;
  }

  const insertedOrders = await db.insert(t.hardwareOrders).values(
    orders.map((o) => ({
      displayId: o.displayId, monthKey: o.monthKey, seqNo: o.seqNo,
      doctorId: o.doctorId, patientId: o.patientId, packageTierId: o.packageTierId,
      orderDate: o.orderDate, deliveryDate: o.deliveryDate, delivered: o.delivered,
      remarks: o.remarks, linkedCaseId: o.linkedCaseId, createdAt: o.createdAt,
    }))
  ).returning();

  const allItems = insertedOrders.flatMap((row, i) =>
    orders[i].items.map((it) => ({ ...it, orderId: row.id }))
  );
  const allAccs = insertedOrders.flatMap((row, i) =>
    orders[i].accessories.map((a) => ({ ...a, orderId: row.id }))
  );
  if (allItems.length) await db.insert(t.hardwareItems).values(allItems);
  if (allAccs.length) await db.insert(t.orderAccessories).values(allAccs);

  // -- Settings -----------------------------------------------------------------
  await db.insert(t.appSettings).values([
    { key: "stuck_threshold_days", value: "3" },
    { key: "lab_name", value: "Mumbai Surgical Guide Lab" },
  ]).onConflictDoNothing();

  // -- Activity log seed ----------------------------------------------------------
  const recentHist = await db.select().from(t.statusHistory).orderBy(desc(t.statusHistory.createdAt)).limit(10);
  await db.insert(t.activityLog).values(
    recentHist.map((h) => ({
      staffId: h.staffId ?? defaultUser.id,
      entityType: "guide_case",
      entityId: h.caseId,
      action: "status_changed",
      detail: "Status updated",
      createdAt: h.createdAt,
    }))
  );

  return {
    staff: staffRows.length,
    doctors: doctorRows.length,
    patients: patientRows.length,
    cases: insertedCases.length,
    orders: insertedOrders.length,
  };
}
