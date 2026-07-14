import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public suppliers
 */
export const supplierSelect = {
  id: true,
  name: true,
} satisfies Prisma.suppliersSelect;

/**
 * Supplier type
 */
export type SupplierPublic = Prisma.suppliersGetPayload<{
  select: typeof supplierSelect;
}>;

/**
 * Create supplier input type
 */
export type CreateSupplierInput = {
  name: string;
};

/**
 * Update supplier input type
 */
export type UpdateSupplierInput = {
  name?: string;
};
