import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteSupplier,
  getSupplierById,
  updateSupplier,
} from "@/services/suppliers/suppliers-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/suppliers/:id — get a supplier by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const supplier = await getSupplierById(id);

    if (!supplier) {
      return jsonError("NOT_FOUND", "Supplier not found.", 404);
    }

    return jsonData(supplier);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/suppliers/:id — update a supplier */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const supplier = await updateSupplier(id, body);

    return jsonData(supplier);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/suppliers/:id — delete a supplier */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const supplier = await deleteSupplier(id);
    return jsonData(supplier);
  } catch (error) {
    return handleRouteError(error);
  }
}
