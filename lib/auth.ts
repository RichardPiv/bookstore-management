import { cookies } from "next/headers";

import { AppError } from "@/lib/api/route-errors";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdminRole, isPlayerRole, type UserRole } from "@/lib/roles";
import { getUserBySessionToken } from "@/services/auth/auth-service";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
};

/** Resolve the authenticated user from the session cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const user = await getUserBySessionToken(token);
  if (!user) {
    return null;
  }

  return user;
}

/** Require any authenticated session. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return user;
}

/** Require role=admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (!isAdminRole(user.role)) {
    throw new AppError("FORBIDDEN", "Admin access required.", 403);
  }
  return user;
}

/** Require role=user (player with a bookstore). */
export async function requirePlayer(): Promise<SessionUser> {
  const user = await requireAuth();
  if (!isPlayerRole(user.role)) {
    throw new AppError("FORBIDDEN", "Player access required.", 403);
  }
  return user;
}
