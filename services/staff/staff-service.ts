import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  generateDna,
  outfitForRole,
  serializeDna,
} from "@/scripts/characters/dna";
import {
  applyXpGains,
  defaultStats,
  parseStats,
  type EmployeeRole,
  type EmployeeStats,
  type StaffXpKind,
} from "@/simulation/types";

import { employeeSelect, type EmployeePublic, type StaffCandidate } from "./types";

type TransactionClient = Prisma.TransactionClient;

const STARTER: Array<{
  name: string;
  role: EmployeeRole;
  wage: string;
  lore_code: string;
  dismissible: boolean;
}> = [
  {
    name: "Maître Elian Voss",
    role: "receiver",
    wage: "48.00",
    lore_code: "NPC-001",
    dismissible: false,
  },
  {
    name: "Sœur Maëline",
    role: "stocker",
    wage: "42.00",
    lore_code: "NPC-002",
    dismissible: false,
  },
  {
    name: "Oriel Hale",
    role: "clerk",
    wage: "36.00",
    lore_code: "STAFF-CLERK",
    dismissible: true,
  },
];

const CANDIDATE_NAMES = [
  ["Tavian Relm", "clerk"],
  ["Sera Quill", "clerk"],
  ["Bram Cinder", "stocker"],
  ["Neris Vale", "stocker"],
  ["Corvin Hale", "receiver"],
  ["Ilyna Dock", "receiver"],
  ["Maedhros Parch", "clerk"],
  ["Ysolde Fen", "stocker"],
] as const;

function jitter(base: EmployeeStats, seed: number): EmployeeStats {
  const n = (offset: number) => ((seed * (offset + 3)) % 21) - 10;
  const clamp = (v: number) => Math.max(25, Math.min(95, v));
  return {
    ...base,
    morale: clamp(base.morale + n(1)),
    reliability: clamp(base.reliability + n(2)),
    checkout_speed: clamp(base.checkout_speed + n(3)),
    advice: clamp(base.advice + n(4)),
    restock_speed: clamp(base.restock_speed + n(5)),
    carry: clamp(base.carry + n(6)),
    receive_speed: clamp(base.receive_speed + n(7)),
    specialty_shelf:
      base.specialty_shelf ??
      (["shelf_his", "shelf_arc", "shelf_bot", "shelf_nec"] as const)[
        Math.abs(seed) % 4
      ]!,
  };
}

export async function ensureStarterStaff(
  userId: number,
  tx: TransactionClient = prisma,
): Promise<void> {
  const count = await tx.employees.count({
    where: { user_id: userId, status: { not: "dismissed" } },
  });
  if (count > 0) return;

  for (const starter of STARTER) {
    const stats = defaultStats(starter.role);
    if (starter.role === "clerk") {
      stats.specialty_shelf = "shelf_his";
    } else if (starter.role === "stocker") {
      stats.specialty_shelf = "shelf_arc";
    }
    const dna = generateDna(`lore-${starter.lore_code}-${userId}`, {
      outfit: outfitForRole(starter.role),
    });
    await tx.employees.create({
      data: {
        user_id: userId,
        name: starter.name,
        role: starter.role,
        wage_daily: new Prisma.Decimal(starter.wage),
        status: "idle",
        appearance_json: serializeDna(dna),
        stats_json: JSON.stringify(stats),
        lore_code: starter.lore_code,
        is_dismissible: starter.dismissible,
        hired_at: new Date(),
      },
    });
  }
}

/**
 * P2.3 / L1 : Elian & Maëline restent employés jouables non licenciables
 * (pas de simples NPC caméra). Réaffirme le flag si une ancienne save diverge.
 */
export async function ensureLoreStaffFlags(
  userId: number,
  tx: TransactionClient = prisma,
): Promise<void> {
  for (const starter of STARTER.filter((row) => !row.dismissible)) {
    await tx.employees.updateMany({
      where: {
        user_id: userId,
        lore_code: starter.lore_code,
        status: { not: "dismissed" },
      },
      data: {
        is_dismissible: false,
        name: starter.name,
        role: starter.role,
      },
    });
  }
}

export async function listEmployees(userId: number): Promise<EmployeePublic[]> {
  await ensureStarterStaff(userId);
  await ensureLoreStaffFlags(userId);
  return prisma.employees.findMany({
    where: { user_id: userId, status: { not: "dismissed" } },
    select: employeeSelect,
    orderBy: [{ role: "asc" }, { id: "asc" }],
  });
}

export async function getEmployee(
  userId: number,
  id: number,
): Promise<EmployeePublic | null> {
  return prisma.employees.findFirst({
    where: { id, user_id: userId, status: { not: "dismissed" } },
    select: employeeSelect,
  });
}

export function listCandidates(userId: number, simDay: number): StaffCandidate[] {
  const seed = userId * 97 + simDay * 13;
  const start = seed % CANDIDATE_NAMES.length;
  const picks: StaffCandidate[] = [];
  for (let i = 0; i < 5; i += 1) {
    const [name, role] = CANDIDATE_NAMES[(start + i * 3) % CANDIDATE_NAMES.length]!;
    const typedRole = role as EmployeeRole;
    const stats = jitter(defaultStats(typedRole), seed + i * 17);
    const wage = (28 + (stats.checkout_speed + stats.restock_speed + stats.receive_speed) / 12).toFixed(2);
    const key = `${simDay}-${i}-${name}`;
    picks.push({
      key,
      name,
      role: typedRole,
      wage_daily: wage,
      appearance: generateDna(`cand-${userId}-${key}`, {
        outfit: outfitForRole(typedRole),
      }),
      stats,
      blurb:
        typedRole === "clerk"
          ? "À l'aise au comptoir, sait parler aux érudits pressés."
          : typedRole === "stocker"
            ? "Connaît les allées de la réserve comme sa poche."
            : "Habitué au Quai des Convoyeurs et aux caisses scellées.",
    });
  }
  return picks;
}

export async function recruitEmployee(
  userId: number,
  candidate: StaffCandidate,
): Promise<EmployeePublic> {
  return prisma.employees.create({
    data: {
      user_id: userId,
      name: candidate.name,
      role: candidate.role,
      wage_daily: new Prisma.Decimal(candidate.wage_daily),
      status: "idle",
      appearance_json: serializeDna(candidate.appearance),
      stats_json: JSON.stringify(candidate.stats),
      is_dismissible: true,
      hired_at: new Date(),
    },
    select: employeeSelect,
  });
}

export async function dismissEmployee(
  userId: number,
  id: number,
): Promise<EmployeePublic> {
  const employee = await getEmployee(userId, id);
  if (!employee) {
    throw new AppError("NOT_FOUND", "Employee not found.", 404);
  }
  if (!employee.is_dismissible) {
    throw new AppError(
      "BUSINESS_RULE",
      "This archivist cannot be dismissed.",
      409,
    );
  }
  return prisma.employees.update({
    where: { id: employee.id },
    data: { status: "dismissed" },
    select: employeeSelect,
  });
}

export async function patchEmployee(
  userId: number,
  id: number,
  body: {
    role?: EmployeeRole;
    status?: "idle" | "paused";
    specialty_shelf?: string | null;
    counter_focus?: boolean;
  },
): Promise<EmployeePublic> {
  const employee = await getEmployee(userId, id);
  if (!employee) {
    throw new AppError("NOT_FOUND", "Employee not found.", 404);
  }

  let stats = parseStats(employee.stats_json);
  let statsChanged = false;
  if (body.specialty_shelf !== undefined) {
    const raw = body.specialty_shelf;
    if (raw === null || raw === "" || raw === "none") {
      stats.specialty_shelf = null;
    } else if (/^shelf_[a-z0-9]+$/i.test(raw)) {
      stats.specialty_shelf = raw.toLowerCase();
    } else {
      throw new AppError("VALIDATION_ERROR", "Invalid specialty_shelf.", 400);
    }
    statsChanged = true;
  }
  if (body.counter_focus !== undefined) {
    stats.counter_focus = Boolean(body.counter_focus);
    statsChanged = true;
  }
  if (body.role && body.role !== employee.role) {
    // Nouveau rôle : garder XP / moral, recalibrer focus par défaut si non fourni
    if (body.counter_focus === undefined) {
      stats.counter_focus = body.role === "clerk";
      statsChanged = true;
    }
  }

  return prisma.employees.update({
    where: { id: employee.id },
    data: {
      ...(body.role ? { role: body.role } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(statsChanged ? { stats_json: JSON.stringify(stats) } : {}),
    },
    select: employeeSelect,
  });
}

/** Formation légère après une tâche réussie (P1.5). */
export async function applyTaskXp(
  userId: number,
  employeeId: number,
  kind: StaffXpKind,
  tx: TransactionClient = prisma,
): Promise<EmployeeStats | null> {
  const row = await tx.employees.findFirst({
    where: { id: employeeId, user_id: userId, status: { not: "dismissed" } },
    select: { id: true, stats_json: true },
  });
  if (!row) return null;
  const stats = applyXpGains(parseStats(row.stats_json), kind);
  await tx.employees.update({
    where: { id: row.id },
    data: { stats_json: JSON.stringify(stats) },
  });
  return stats;
}

export async function applyMoraleDelta(
  userId: number,
  delta: number,
  tx: TransactionClient = prisma,
): Promise<void> {
  const staff = await tx.employees.findMany({
    where: { user_id: userId, status: { not: "dismissed" } },
    select: { id: true, stats_json: true },
  });
  for (const row of staff) {
    let stats: EmployeeStats;
    try {
      stats = JSON.parse(row.stats_json) as EmployeeStats;
    } catch {
      stats = defaultStats("clerk");
    }
    stats.morale = Math.max(5, Math.min(100, (stats.morale ?? 70) + delta));
    await tx.employees.update({
      where: { id: row.id },
      data: { stats_json: JSON.stringify(stats) },
    });
  }
}
