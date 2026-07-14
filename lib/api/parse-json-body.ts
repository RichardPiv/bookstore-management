import { AppError } from "./route-errors";

/** Parse a JSON request body, or throw a 400 on invalid JSON. */
export async function parseJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();

  if (text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("INVALID_JSON", "Invalid JSON body.", 400);
  }
}
