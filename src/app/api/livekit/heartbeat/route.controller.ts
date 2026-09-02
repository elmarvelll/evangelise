import { badRequest, json, notFound, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { recordHeartbeat } from "@/services/livestream.service";
import { NotFoundError } from "@/services/errors";

/**
 * POST /api/livekit/heartbeat
 * Called periodically by the broadcaster's client to prove the stream
 * is still alive; consumed by `cleanupStaleStreams`.
 */
export async function heartbeatController(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const { roomId } = await request.json();

    if (!roomId) {
      return badRequest("Missing roomId");
    }

    await recordHeartbeat(session.user.id, roomId);

    return json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    console.error("Heartbeat error:", error);
    return serverError("Heartbeat failed");
  }
}
