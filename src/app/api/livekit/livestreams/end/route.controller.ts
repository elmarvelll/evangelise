import { json, notFound } from "@/lib/http";
import { endBroadcastRoom } from "@/services/livekit.service";
import { NotFoundError } from "@/services/errors";

/**
 * POST /api/livekit/livestreams/end
 * Ends the LiveKit room and marks the livestream ENDED.
 *
 * NOTE (pre-existing behavior, kept as-is): no session/ownership check —
 * see `endBroadcastRoom` in `livekit.service.ts`.
 */
export async function endBroadcastController(request: Request) {
  const { id } = await request.json();

  try {
    await endBroadcastRoom(id);
    return json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    throw error;
  }
}
