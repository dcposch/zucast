import { inferAsyncReturnType } from "@trpc/server";
import { auth } from ".";
import * as trpcNext from "@trpc/server/adapters/next";
import { COOKIE_ZUCAST_TOKEN } from "src/common/constants";

export async function createContext({
  req,
}: trpcNext.CreateNextContextOptions) {
  const { cookie } = req.headers;
  const prefix = `${COOKIE_ZUCAST_TOKEN}=`;
  if (cookie == null || !cookie.startsWith(prefix)) {
    return { authUID: null };
  }

  const authUID = auth.authenticate(cookie.substring(prefix.length));
  return { authUID };
}

export type Context = inferAsyncReturnType<typeof createContext>;
