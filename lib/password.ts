import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hash a password before storing it in the database (never in clear). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a clear password against a hash (useful for login later). */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
