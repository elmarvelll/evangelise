import { ConfigurationError } from "@/services/errors";

export function getLiveKitCredentials() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new ConfigurationError("LiveKit server credentials are missing");
  }

  return { apiKey, apiSecret };
}
