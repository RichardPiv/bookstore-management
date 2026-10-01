import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { AppError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getClock } from "@/services/clock/clock-service";
import { listCandidates, recruitEmployee } from "@/services/staff/staff-service";

/** POST /api/staff/recruit */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    if (!body || typeof body !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
    }
    const key = (body as { candidate_key?: unknown }).candidate_key;
    if (typeof key !== "string" || key.length < 2) {
      throw new AppError("VALIDATION_ERROR", 'The field "candidate_key" is required.', 400);
    }
    const clock = await getClock(session.id);
    const candidate = listCandidates(session.id, clock.sim_day).find(
      (row) => row.key === key,
    );
    if (!candidate) {
      throw new AppError("NOT_FOUND", "Candidate is no longer available.", 404);
    }
    const employee = await recruitEmployee(session.id, candidate);
    return jsonData(employee, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
