import { RoomServiceClient } from "livekit-server-sdk";
import { getLiveKitCredentials } from "@/services/livekit.service";

/**
 * The authoritative "current viewers" number comes straight from LiveKit,
 * not a database counter — viewers are anonymous (`viewer-${uuid}`
 * identity, see `livekit.service/create-viewer-session.ts`), so there is
 * no user row to track presence against, and LiveKit already knows
 * exactly who is connected to the room right now. Excludes the
 * broadcaster's own identity (`userId`), who is a participant in the
 * room but not a "viewer".
 */
export async function getLiveViewerCount(roomName: string, broadcasterUserId: string) {
  const { apiKey, apiSecret } = getLiveKitCredentials();
  const roomService = new RoomServiceClient(process.env.LIVEKIT_URL!, apiKey, apiSecret);

  try {
    const participants = await roomService.listParticipants(roomName);
    return participants.filter((p) => p.identity !== broadcasterUserId).length;
  } catch {
    // Room doesn't exist (stream not live, or already torn down) — no viewers.
    return 0;
  }
}
