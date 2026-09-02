import { getActiveLivestreamController } from "./route.controller";

export async function GET() {
  return getActiveLivestreamController();
}
