import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

/** JSON success response with the format `{ data: ... }`. */
export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** JSON error response with a business code and a readable message. */
export function jsonError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}
