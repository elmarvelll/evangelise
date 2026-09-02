import { badRequest, json, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { createBroadcastSession } from "@/services/livekit.service";
import { ConfigurationError, ValidationError } from "@/services/errors";

/**
 * POST /api/livekit/token
 * Saves the stream-setup payload and issues a publisher token — the
 * "go live" action.
 */
export async function createBroadcastTokenController(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return unauthorized("Unauthorized.");
  }

  try {
    const data = await request.json();
    const result = await createBroadcastSession(data, session.user);

    return json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    if (error instanceof ConfigurationError) {
      return serverError(error.message);
    }

    console.error("LiveKit token error:", error);
    return serverError("Failed to create LiveKit token");
  }
}
