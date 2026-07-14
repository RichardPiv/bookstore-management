import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public alert statuses
 */
export const alertStatusSelect = {
  id: true,
  name: true,
} satisfies Prisma.alert_statusesSelect;

/**
 * Alert status type
 */
export type AlertStatusPublic = Prisma.alert_statusesGetPayload<{
  select: typeof alertStatusSelect;
}>;

/**
 * Create alert status input type
 */
export type CreateAlertStatusInput = {
  name: string;
};

/**
 * Update alert status input type
 */
export type UpdateAlertStatusInput = {
  name?: string;
};
