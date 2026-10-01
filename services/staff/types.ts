import { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeRole } from "@/simulation/types";
import type { CharacterDna } from "@/scripts/characters/dna";
import type { EmployeeStats } from "@/simulation/types";

export const EMPLOYEE_ROLES = ["clerk", "stocker", "receiver"] as const;

export const employeeSelect = {
  id: true,
  user_id: true,
  name: true,
  role: true,
  wage_daily: true,
  hired_at: true,
  status: true,
  appearance_json: true,
  stats_json: true,
  lore_code: true,
  is_dismissible: true,
} satisfies Prisma.employeesSelect;

export type EmployeePublic = Prisma.employeesGetPayload<{
  select: typeof employeeSelect;
}>;

export type StaffCandidate = {
  key: string;
  name: string;
  role: EmployeeRole;
  wage_daily: string;
  appearance: CharacterDna;
  stats: EmployeeStats;
  blurb: string;
};

export type RecruitStaffInput = {
  candidate_key: string;
};
