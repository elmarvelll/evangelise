import { EventEmitter } from "events";

/**
 * In-process pub/sub for the streamer "activity" SSE feed
 * (`GET /api/livestreams/[id]/activity`). One topic per streamer
 * (`userId`) — a streamer only ever sees their own activity.
 *
 * This is intentionally simple: the app runs as a single Node process
 * today (see `next start`, no Redis/queue in this stack). The database
 * stays the source of truth for everything an activity event describes
 * (a `Follow` row, `livestream.totalViewCount`, etc.) — losing an event
 * here (a dropped SSE connection, a process restart) never loses data,
 * it only means the streamer's live feed misses one line until their
 * client reconnects and re-renders from a fresh fetch.
 *
 * KNOWN LIMITATION: this does not fan out across multiple server
 * instances/processes. A multi-instance production deployment would
 * need a shared pub/sub (Redis, etc.) for events published on one
 * instance to reach a streamer whose SSE connection landed on another.
 * See docs/decisions/livestream-decisions.md.
 */

export type ActivityEvent =
  | { type: "follow"; followerName: string; followerId: string }
  | { type: "viewer_joined"; viewerCount: number }
  | { type: "viewer_left"; viewerCount: number }
  | { type: "stream_started"; livestreamId: string }
  | { type: "stream_ended"; livestreamId: string };

const emitter = new EventEmitter();
// Each streamer's activity feed can have several tabs/subscribers open;
// avoid Node's default-11-listener warning noise.
emitter.setMaxListeners(0);

function topicFor(userId: string) {
  return `activity:${userId}`;
}

export function publishActivity(userId: string, event: ActivityEvent) {
  emitter.emit(topicFor(userId), event);
}

/** Returns an unsubscribe function. */
export function subscribeToActivity(
  userId: string,
  listener: (event: ActivityEvent) => void
) {
  const topic = topicFor(userId);
  emitter.on(topic, listener);

  return () => {
    emitter.off(topic, listener);
  };
}
