import { createViewerTokenController } from "./route.controller";

export async function POST(request: Request) {
  return createViewerTokenController(request);
}
