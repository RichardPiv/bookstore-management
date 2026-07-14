import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public authors
 */
export const authorPublicSelect = {
  id: true,
  name: true,
} satisfies Prisma.authorsSelect;

/**
 * Public authors type
 */
export type AuthorPublic = Prisma.authorsGetPayload<{
  select: typeof authorPublicSelect;
}>;

/**
 * Create author input type
 */
export type CreateAuthorInput = {
  name: string;
};

/**
 * Update author input type
 */
export type UpdateAuthorInput = {
  name?: string;
};
