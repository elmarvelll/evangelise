import { json, serverError, unauthorized } from "@/lib/http";
import {
  handleParticipantJoined,
  handleParticipantLeft,
  verifyWebhookEvent,
} from "@/services/livekit.service";

/**
 * POST /api/livekit/webhook
 * Receives LiveKit room events. `participant_joined` and
 * `participant_left` are acted on; everything else is acknowledged and
 * ignored.
 */
export async function livekitWebhookController(request: Request) {
  try {
    const body = await request.text();
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return unauthorized("Missing authorization");
    }

    const event = await verifyWebhookEvent(body, authHeader);

    console.log("🔔 LiveKit event:", event.event);

    if (event.event !== "participant_left" && event.event !== "participant_joined") {
      return json({ received: true });
    }

    const roomName = event.room?.name;
    const participantIdentity = event.participant?.identity;

    if (!roomName || !participantIdentity) {
      return json({ received: true });
    }

    if (event.event === "participant_joined") {
      console.log("👋 Participant joined:", participantIdentity, "in", roomName);
      await handleParticipantJoined(roomName, participantIdentity);
    } else {
      console.log("👋 Participant left:", participantIdentity, "in", roomName);
      await handleParticipantLeft(roomName, participantIdentity);
    }

    return json({ received: true });
  } catch (error) {
    console.error("❌ LiveKit webhook error:", error);
    return serverError("Webhook processing failed");
  }
}
