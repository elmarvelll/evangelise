import { NextRequest } from "next/server";
import { badRequest, json, serverError } from "@/lib/http";
import { searchLivestreams } from "@/services/search.service";
import { isStreamCategory, isStreamGenre } from "@/lib/stream-taxonomy";

/**
 * GET /api/livestreams
 * Public feed of currently-LIVE streams — with no query params, this is
 * "every live stream" (unchanged from before this change); with
 * `search`/`category`/`genre` it's the same query filtered, and every
 * combination of the three is supported. Cursor-paginated via
 * `cursor`/`limit`.
 *
 * Examples:
 *   /api/livestreams?search=worship
 *   /api/livestreams?category=Music
 *   /api/livestreams?genre=Worship
 *   /api/livestreams?search=worship&category=Music&genre=Worship
 */
export async function listLivestreamsController(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() || undefined;
    const categoryParam = searchParams.get("category");
    const genreParam = searchParams.get("genre");
    const cursor = searchParams.get("cursor") || undefined;
    const limitParam = searchParams.get("limit");

    if (categoryParam !== null && !isStreamCategory(categoryParam)) {
      return badRequest(`Invalid category: ${categoryParam}`);
    }

    if (genreParam !== null && !isStreamGenre(genreParam)) {
      return badRequest(`Invalid genre: ${genreParam}`);
    }

    const category = categoryParam !== null && isStreamCategory(categoryParam) ? categoryParam : undefined;
    const genre = genreParam !== null && isStreamGenre(genreParam) ? genreParam : undefined;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const result = await searchLivestreams({
      search,
      category,
      genre,
      cursor,
      limit: limit !== undefined && Number.isFinite(limit) ? limit : undefined,
    });

    return json(result);
  } catch (error) {
    console.error("Livestream GET route error:", error);
    return serverError("Unable to load livestreams right now.");
  }
}
