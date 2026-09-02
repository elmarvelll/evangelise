import { heartbeatController } from "./route.controller";

export async function POST(request: Request) {
  return heartbeatController(request);
}
