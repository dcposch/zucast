import { NextRequest, NextResponse } from "next/server";
import { server } from "./server";

/** Log requests. */
export default function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { method, url } = request;
  const { status } = response;
  console.log(`[HTTP] ${method} ${url} ${status}`);

  return response;
}
