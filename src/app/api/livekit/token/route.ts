import { createBroadcastTokenController } from "./route.controller";

export async function POST(request: Request) {
  return createBroadcastTokenController(request);
}
