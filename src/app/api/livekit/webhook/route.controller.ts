import { json, serverError, unauthorized } from "@/lib/http";
import { handleParticipantLeft, verifyWebhookEvent } from "@/services/livekit.service";

/**
 * POST /api/livekit/webhook
 * Receives LiveKit room events (only `participant_left` is acted on).
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

    if (event.event !== "participant_left") {
      return json({ received: true });
    }

    const roomName = event.room?.name;
    const participantIdentity = event.participant?.identity;

    if (!roomName || !participantIdentity) {
      return json({ received: true });
    }

    console.log("👋 Participant left");
    console.log("Room:", roomName);
    console.log("Participant:", participantIdentity);

    await handleParticipantLeft(roomName, participantIdentity);

    return json({ received: true });
  } catch (error) {
    console.error("❌ LiveKit webhook error:", error);
    return serverError("Webhook processing failed");
  }
}
