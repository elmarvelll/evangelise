import { endBroadcastController } from "./route.controller";

export async function POST(request: Request) {
  return endBroadcastController(request);
}
