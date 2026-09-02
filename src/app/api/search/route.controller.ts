import { errorResponse } from "@/lib/http";

/**
 * POST /api/search — DEPRECATED.
 *
 * Superseded by `GET /api/livestreams?search=&category=&genre=`, which
 * does everything this endpoint did (text search) plus category/genre
 * filtering and cursor pagination, as one query instead of two separate
 * implementations. The frontend (`SearchBar`) has been migrated; this
 * handler is kept only so an old/cached client gets a clear signal
 * instead of a broken 404.
 */
export async function searchController() {
  return errorResponse(
    "This endpoint has moved. Use GET /api/livestreams?search=&category=&genre= instead.",
    410
  );
}
