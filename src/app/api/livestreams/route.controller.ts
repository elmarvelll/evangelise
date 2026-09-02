import { json, serverError } from "@/lib/http";
import { listActiveLivestreams } from "@/services/livestream.service";

/**
 * GET /api/livestreams
 * Public feed of every currently-LIVE stream.
 */
export async function listLivestreamsController() {
  try {
    const livestreams = await listActiveLivestreams();
    return json({ livestreams });
  } catch (error) {
    console.error("Livestream GET route error:", error);
    return serverError("Unable to load livestreams right now.");
  }
}
