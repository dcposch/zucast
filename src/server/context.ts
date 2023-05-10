import { inferAsyncReturnType } from "@trpc/server";
import { auth } from ".";
import * as trpcNext from "@trpc/server/adapters/next";
import { COOKIE_ZUCAST_TOKEN } from "src/common/constants";

export async function createContext({
  req,
}: trpcNext.CreateNextContextOptions) {
  const cookie = req.cookies[COOKIE_ZUCAST_TOKEN];
  const authUID = auth.authenticate(cookie);
  return { authUID };
}

export type Context = inferAsyncReturnType<typeof createContext>;
