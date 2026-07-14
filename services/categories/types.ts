import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public categories
 */
export const categoriesPublicSelect = {
  id: true,
  name: true,
} satisfies Prisma.categoriesSelect;

/**
 * Public categories type
 */
export type CategoryPublic = Prisma.categoriesGetPayload<{
  select: typeof categoriesPublicSelect;
}>;

/**
 * Create category input type
 */
export type CreateCategoryInput = {
  name: string;
};

/**
 * Update category input type
 */
export type UpdateCategoryInput = {
  name?: string;
};
