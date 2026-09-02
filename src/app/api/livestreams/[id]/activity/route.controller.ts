import { notFound, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { getLivestreamOwnerId } from "@/services/livestream.service";
import { subscribeToActivity, type ActivityEvent } from "@/lib/activity-bus";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const encoder = new TextEncoder();

function formatEvent(event: ActivityEvent) {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * GET /api/livestreams/[id]/activity
 *
 * Server-Sent Events stream of realtime activity for one livestream's
 * owner: follows, viewers joining/leaving, stream start/end. Only the
 * stream's own owner may subscribe — identity comes from the session,
 * never a client-supplied id, and is checked against the livestream's
 * actual `userId` before the stream opens.
 */
export async function activityStreamController(request: Request, { params }: RouteParams) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id: livestreamId } = await params;
  const ownerId = await getLivestreamOwnerId(livestreamId);

  if (!ownerId) {
    return notFound("Livestream not found");
  }

  if (ownerId !== session.user.id) {
    return unauthorized("You can only view your own stream's activity.");
  }

  let unsubscribe: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      // Opens the connection promptly and keeps intermediary proxies from
      // buffering/closing an otherwise-silent stream.
      controller.enqueue(encoder.encode(": connected\n\n"));

      unsubscribe = subscribeToActivity(session.user.id, (event) => {
        try {
          controller.enqueue(formatEvent(event));
        } catch {
          // Controller already closed (client disconnected); the `cancel`
          // callback below will run the same unsubscribe shortly.
        }
      });
    },
    cancel() {
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
