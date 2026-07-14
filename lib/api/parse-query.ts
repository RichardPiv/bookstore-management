import { AppError } from "./route-errors";

/** Parse optional `?active=true|false` for book listing. */
export function parseActiveQueryParam(
  value: string | null,
): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new AppError(
    "INVALID_QUERY",
    'Query parameter "active" must be "true" or "false".',
    400,
  );
}

/** Parse optional positive integer query parameter. */
export function parsePositiveIntQueryParam(
  value: string | null,
  name: string,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(
      "INVALID_QUERY",
      `Query parameter "${name}" must be a positive integer.`,
      400,
    );
  }

  return parsed;
}
