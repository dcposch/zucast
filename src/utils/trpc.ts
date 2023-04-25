import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { AppRouter } from "../pages/api/trpc/[trpc]";

function getBaseUrl() {
  // In the browser, we return a relative URL
  if (typeof window !== "undefined") return "";

  // When rendering on the server, we return an absolute URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    const url = getBaseUrl() + "/api/trpc";
    return { links: [httpBatchLink({ url })] };
  },
  ssr: true,
});
