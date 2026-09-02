import { json, serverError, unauthorized } from "@/lib/http";
import { cleanupStaleStreams } from "@/services/livestream.service";

/**
 * GET /api/livekit/cleanup
 * Cron-only endpoint (protected by `CRON_SECRET`, see vercel.json) that
 * ends any stream whose heartbeat has gone stale.
 */
export async function cleanupController(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is missing");
      return serverError("Server configuration error");
    }

    if (authorization !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cleanup request");
      return unauthorized();
    }

    const endedCount = await cleanupStaleStreams();

    return json({ success: true, endedCount });
  } catch (error) {
    console.error("Cleanup error:", error);
    return serverError("Failed to cleanup stale streams");
  }
}
