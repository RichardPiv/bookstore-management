import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { listTasks } from "@/services/tasks/tasks-service";
import type { TaskStatus } from "@/services/tasks/types";
import { TASK_STATUSES } from "@/services/tasks/types";
import { AppError } from "@/lib/api/route-errors";

/** GET /api/tasks */
export async function GET(request: Request) {
  try {
    const session = await requirePlayer();
    const status = new URL(request.url).searchParams.get("status");
    let parsed: TaskStatus | undefined;
    if (status) {
      if (!(TASK_STATUSES as readonly string[]).includes(status)) {
        throw new AppError("INVALID_QUERY", "Invalid task status.", 400);
      }
      parsed = status as TaskStatus;
    }
    const tasks = await listTasks(session.id, parsed);
    return jsonData(tasks);
  } catch (error) {
    return handleRouteError(error);
  }
}
