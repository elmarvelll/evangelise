import { livekitWebhookController } from "./route.controller";

export async function POST(request: Request) {
  return livekitWebhookController(request);
}
