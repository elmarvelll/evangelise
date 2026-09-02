import { createReconnectTokenController } from "./route.controller";

export async function POST(request: Request) {
  return createReconnectTokenController(request);
}
