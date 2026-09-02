import { NextRequest } from "next/server";
import { listLivestreamsController } from "./route.controller";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return listLivestreamsController(request);
}
