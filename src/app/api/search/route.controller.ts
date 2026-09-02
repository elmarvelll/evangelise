import { NextRequest } from "next/server";
import { json, serverError } from "@/lib/http";
import { searchLivestreams } from "@/services/search.service";

/**
 * POST /api/search
 * Reads `q` and `filters` from the query string (kept as POST to match
 * the existing frontend contract in `SearchBar`, even though the
 * request carries no body).
 */
export async function searchController(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("q")?.trim() ?? "";

    const filters =
      searchParams
        .get("filters")
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean) ?? [];

    if (!query && filters.length === 0) {
      return json([]);
    }

    const results = await searchLivestreams(query, filters);

    return json(results);
  } catch (error) {
    console.error("Search error:", error);
    return serverError("Failed to search livestreams");
  }
}
