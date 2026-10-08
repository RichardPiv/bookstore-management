import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { AppError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getEmployee, patchEmployee } from "@/services/staff/staff-service";
import { EMPLOYEE_ROLES } from "@/services/staff/types";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/staff/:id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requirePlayer();
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }
    const employee = await getEmployee(session.id, id);
    if (!employee) {
      return jsonError("NOT_FOUND", "Employee not found.", 404);
    }
    return jsonData(employee);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/staff/:id */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayer();
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }
    const body = await parseJsonBody(request);
    if (!body || typeof body !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
    }
    const raw = body as {
      role?: unknown;
      status?: unknown;
      specialty_shelf?: unknown;
      counter_focus?: unknown;
    };
    const patch: {
      role?: (typeof EMPLOYEE_ROLES)[number];
      status?: "idle" | "paused";
      specialty_shelf?: string | null;
      counter_focus?: boolean;
    } = {};
    if (raw.role !== undefined) {
      if (!(EMPLOYEE_ROLES as readonly string[]).includes(String(raw.role))) {
        throw new AppError("VALIDATION_ERROR", "Invalid role.", 400);
      }
      patch.role = raw.role as (typeof EMPLOYEE_ROLES)[number];
    }
    if (raw.status !== undefined) {
      if (raw.status !== "idle" && raw.status !== "paused") {
        throw new AppError("VALIDATION_ERROR", "Invalid status.", 400);
      }
      patch.status = raw.status;
    }
    if (raw.specialty_shelf !== undefined) {
      if (raw.specialty_shelf === null) {
        patch.specialty_shelf = null;
      } else if (typeof raw.specialty_shelf === "string") {
        patch.specialty_shelf = raw.specialty_shelf;
      } else {
        throw new AppError("VALIDATION_ERROR", "Invalid specialty_shelf.", 400);
      }
    }
    if (raw.counter_focus !== undefined) {
      if (typeof raw.counter_focus !== "boolean") {
        throw new AppError("VALIDATION_ERROR", "Invalid counter_focus.", 400);
      }
      patch.counter_focus = raw.counter_focus;
    }
    const employee = await patchEmployee(session.id, id, patch);
    return jsonData(employee);
  } catch (error) {
    return handleRouteError(error);
  }
}
