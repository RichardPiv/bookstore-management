import { prisma } from "@/lib/prisma";
import { SupplierPublic, supplierSelect } from "./types";
import {
  validateCreateSupplierInput,
  validateUpdateSupplierInput,
} from "./validation";

/** List all suppliers. */
export async function listSuppliers(): Promise<SupplierPublic[]> {
  return prisma.suppliers.findMany({
    select: supplierSelect,
    orderBy: { name: "asc" },
  });
}

/** Get a supplier by id. */
export async function getSupplierById(
  id: number,
): Promise<SupplierPublic | null> {
  return prisma.suppliers.findUnique({
    where: { id },
    select: supplierSelect,
  });
}

/** Create a supplier. */
export async function createSupplier(body: unknown): Promise<SupplierPublic> {
  const input = validateCreateSupplierInput(body);
  return prisma.suppliers.create({
    data: { name: input.name },
    select: supplierSelect,
  });
}

/** Update a supplier. */
export async function updateSupplier(
  id: number,
  body: unknown,
): Promise<SupplierPublic> {
  const input = validateUpdateSupplierInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.suppliers.update({
    where: { id },
    data,
    select: supplierSelect,
  });
}

/** Delete a supplier. */
export async function deleteSupplier(id: number): Promise<SupplierPublic> {
  return prisma.suppliers.delete({
    where: { id },
    select: supplierSelect,
  });
}
