import { createReportController } from "./route.controller";

export async function POST(request: Request) {
  return createReportController(request);
}
