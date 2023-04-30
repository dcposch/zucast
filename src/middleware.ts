import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { method, url } = request;
  const { status } = response;
  console.log(`[HTTP] ${method} ${url} ${status}`);

  return response;
}
