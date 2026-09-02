import { cleanupController } from "./route.controller";

export async function GET(request: Request) {
  return cleanupController(request);
}
