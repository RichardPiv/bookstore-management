import { Prisma } from "@/lib/generated/prisma/client";

import { jsonError } from "./responses";

/** Business error (validation, functional rule…). */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Transform an unknown error into a consistent HTTP response for Route Handlers. */
export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.code, error.message, error.status);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return jsonError(
          "UNIQUE_CONSTRAINT",
          "A resource with these values already exists.",
          409,
        );
      case "P2003":
        return jsonError(
          "FOREIGN_KEY_CONSTRAINT",
          "It is not possible to delete this resource because it is still used elsewhere.",
          409,
        );
      case "P2025":
        return jsonError("NOT_FOUND", "Resource not found.", 404);
      default:
        break;
    }
  }

  console.error("Unhandled route error:", error);

  return jsonError("INTERNAL_ERROR", "An internal error occurred.", 500);
}
