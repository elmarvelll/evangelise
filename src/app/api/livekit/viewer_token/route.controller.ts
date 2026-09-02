import { badRequest, json, notFound, serverError } from "@/lib/http";
import { createViewerSession } from "@/services/livekit.service";
import { ConfigurationError, NotFoundError, ValidationError } from "@/services/errors";

/**
 * POST /api/livekit/viewer_token
 * Public: issues a subscribe-only token so anyone can watch a LIVE
 * stream without an account.
 */
export async function createViewerTokenController(request: Request) {
  try {
    const { id } = await request.json();
    const result = await createViewerSession(id);

    return json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    if (error instanceof ConfigurationError) {
      return serverError(error.message);
    }

    console.error("LiveKit viewer token error:", error);
    return serverError("Failed to create viewer token");
  }
}
