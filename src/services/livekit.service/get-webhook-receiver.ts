import { WebhookReceiver } from "livekit-server-sdk";
import { getLiveKitCredentials } from "./get-livekit-credentials";

export function getWebhookReceiver() {
  const { apiKey, apiSecret } = getLiveKitCredentials();
  return new WebhookReceiver(apiKey, apiSecret);
}
