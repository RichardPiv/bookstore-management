import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public users
 */
export const userPublicSelect = {
  id: true,
  username: true,
  email: true,
} satisfies Prisma.usersSelect;

export type UserPublic = Prisma.usersGetPayload<{
  select: typeof userPublicSelect;
}>;

/**
 * Create user input type
 */
export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

/**
 * Update user input type
 */
export type UpdateUserInput = {
  username?: string;
  email?: string;
  password?: string;
};
