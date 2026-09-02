import type { WebhookEvent } from "livekit-server-sdk";
import { getWebhookReceiver } from "./get-webhook-receiver";

export async function verifyWebhookEvent(body: string, authHeader: string): Promise<WebhookEvent> {
  return getWebhookReceiver().receive(body, authHeader);
}
