import { Prisma } from "@/lib/generated/prisma/client";

import type { AlertStatusPublic } from "@/services/alert_statuses/types";
import type { AlertTypePublic } from "@/services/alert_types/types";
import type { StockPublic } from "@/services/stocks/types";

export const alertPublicSelect = {
  id: true,
  description: true,
  alert_datetime: true,
  book_id: true,
  alert_type_id: true,
  alert_status_id: true,
} satisfies Prisma.alertsSelect;

export type AlertPublic = Prisma.alertsGetPayload<{
  select: typeof alertPublicSelect;
}>;

export type AlertWithRelations = AlertPublic & {
  book: StockPublic | null;
  alert_type: AlertTypePublic | null;
  alert_status: AlertStatusPublic | null;
};

export type CreateAlertInput = {
  description: string;
  alert_datetime: Date;
  book_id: number;
  alert_type_id: number;
  alert_status_id: number;
};

export type UpdateAlertInput = {
  description?: string;
  alert_datetime?: Date;
  book_id?: number;
  alert_type_id?: number;
  alert_status_id?: number;
};

export type ListAlertsOptions = {
  book_id?: number;
  alert_status_id?: number;
};
