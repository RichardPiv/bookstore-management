import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData, jsonError } from "@/lib/api/responses";
import {
  deleteFormat,
  getFormatById,
  updateFormat,
} from "@/services/formats/formats-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const format = await getFormatById(id);
    if (!format) {
      return jsonError("NOT_FOUND", "Format not found.", 404);
    }

    return jsonData(format);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const format = await updateFormat(id, body);
    return jsonData(format);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const format = await deleteFormat(id);
    return jsonData(format);
  } catch (error) {
    return handleRouteError(error);
  }
}
