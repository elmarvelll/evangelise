import { NextRequest } from "next/server";
import { searchController } from "./route.controller";

export async function POST(request: NextRequest) {
  return searchController(request);
}
