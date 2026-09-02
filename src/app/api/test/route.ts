import { healthCheckController } from "./route.controller";

export async function GET() {
  return healthCheckController();
}
