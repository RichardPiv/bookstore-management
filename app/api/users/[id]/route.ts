import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData, jsonError } from "@/lib/api/responses";
import {
  deleteUser,
  getUserById,
  updateUser,
} from "@/services/users/users-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/users/:id — détail d'un administrateur */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const user = await getUserById(id);

    if (!user) {
      return jsonError("NOT_FOUND", "User not found.", 404);
    }

    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/users/:id — mise à jour partielle */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const user = await updateUser(id, body);

    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/users/:id — suppression */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const user = await deleteUser(id);
    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
