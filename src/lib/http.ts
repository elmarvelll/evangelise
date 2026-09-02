import { NextResponse } from "next/server";

/**
 * Small, shared response helpers so controllers don't hand-roll
 * `NextResponse.json({ error: ... }, { status: ... })` everywhere.
 *
 * These intentionally preserve the response shape the frontend already
 * depends on: `{ error: string }` on failure, plain payloads on success.
 */

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

export function unauthorized(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function notFound(message: string) {
  return errorResponse(message, 404);
}

export function conflict(message: string) {
  return errorResponse(message, 409);
}

export function serverError(message: string) {
  return errorResponse(message, 500);
}
