import { badRequest, json, notFound, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { createReconnectSession } from "@/services/livekit.service";
import { ConfigurationError, NotFoundError } from "@/services/errors";

/**
 * POST /api/livekit/token/reconnect
 * Issues a fresh publisher token for a stream the caller already owns,
 * so a dropped connection can resume the same LiveKit room.
 */
export async function createReconnectTokenController(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const data = await request.json();

    if (!data.livestreamId) {
      return badRequest("livestreamId is required");
    }

    const result = await createReconnectSession(data.livestreamId, session.user.id);

    return json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    if (error instanceof ConfigurationError) {
      return serverError(error.message);
    }

    console.error("LiveKit reconnect token error:", error);
    return serverError("Failed to create reconnect token");
  }
}
