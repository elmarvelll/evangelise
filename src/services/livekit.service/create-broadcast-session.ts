import { AccessToken } from "livekit-server-sdk";
import type { User } from "next-auth";
import { ValidationError } from "@/services/errors";
import { createLivestream } from "@/services/livestream.service";
import { getLiveKitCredentials } from "./get-livekit-credentials";

/**
 * Validates the incoming stream-setup payload, saves the livestream row,
 * and issues a publisher (broadcaster) token for it. Backs
 * `POST /api/livekit/token`, the "go live" action.
 */
export async function createBroadcastSession(
  payload: {
    sessionName?: unknown;
    sessionDescription?: unknown;
    selectedTags?: unknown;
    interactionsEnabled?: unknown;
    streamMode?: unknown;
    scheduleDate?: unknown;
  },
  sessionUser: User
) {
  if (
    !payload.sessionName ||
    !payload.sessionDescription ||
    !Array.isArray(payload.selectedTags) ||
    payload.selectedTags.length === 0
  ) {
    throw new ValidationError("Invalid livestream data");
  }

  const livestream = await createLivestream(payload, sessionUser);
  const { apiKey, apiSecret } = getLiveKitCredentials();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: livestream.userId,
    ttl: "1h",
  });

  token.addGrant({
    room: livestream.id,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    token: await token.toJwt(),
    livestreamId: livestream.id,
    roomName: livestream.id,
    message: "LiveKit token created successfully",
  };
}
