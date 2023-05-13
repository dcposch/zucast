import { inferAsyncReturnType } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { Cookie } from "src/common/constants";
import { auth } from ".";

export async function createContext({
  req,
}: trpcNext.CreateNextContextOptions) {
  const cookie = req.cookies[Cookie.ZucastToken];
  const authUID = auth.authenticate(cookie);
  return { authUID };
}

export type Context = inferAsyncReturnType<typeof createContext>;
