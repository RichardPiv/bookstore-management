/** Cookie name for the admin session token (D49). */
export const SESSION_COOKIE_NAME = "session_token";

/**
 * Non-httpOnly role hint for middleware routing only.
 * Auth decisions still rely on the httpOnly session token + DB.
 */
export const SESSION_ROLE_COOKIE_NAME = "session_role";

/** Session lifetime: 1 day (D50). */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/** Generate an opaque session token (64 hex chars). */
export function createSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Cookie options for the session token. */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Cookie options for the role hint (readable by middleware). */
export function sessionRoleCookieOptions(expiresAt: Date) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Cleared cookie options (session + role). */
export function clearedCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function clearedRoleCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
