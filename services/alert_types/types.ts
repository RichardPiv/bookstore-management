import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public alert types
 */
export const alertTypeSelect = {
  id: true,
  name: true,
} satisfies Prisma.alert_typesSelect;

/**
 * Alert type type
 */
export type AlertTypePublic = Prisma.alert_typesGetPayload<{
  select: typeof alertTypeSelect;
}>;

/**
 * Create alert type input type
 */
export type CreateAlertTypeInput = {
  name: string;
};

/**
 * Update alert type input type
 */
export type UpdateAlertTypeInput = {
  name?: string;
};
