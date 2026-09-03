export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const INITIAL_TREASURY_BALANCE = 10000;
export const INITIAL_TREASURY_LOW_THRESHOLD = 1000;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function isPlayerRole(role: string): boolean {
  return role === "user";
}
