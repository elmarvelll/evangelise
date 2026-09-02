import { listLivestreamsController } from "./route.controller";

export const runtime = "nodejs";

export async function GET() {
  return listLivestreamsController();
}
