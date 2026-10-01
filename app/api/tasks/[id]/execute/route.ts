import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { requirePlayer } from "@/lib/auth";
import { executeTask } from "@/services/tasks/tasks-service";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/tasks/:id/execute */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requirePlayer();
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }
    const task = await executeTask(session.id, id);
    return jsonData(task);
  } catch (error) {
    return handleRouteError(error);
  }
}
