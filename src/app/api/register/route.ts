import { registerController } from "./route.controller";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return registerController(request);
}
