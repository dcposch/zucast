/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import { auth } from "@/server/auth";
import { feed } from "@/server/feed";
import { StoredAction, actionModel } from "@/common/model";
import { publicProcedure, router } from "@/server/trpc";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";

const appRouter = router({
  greeting: publicProcedure
    .input(
      z.object({
        name: z.string().nullish(),
      })
    )
    .query(({ input }) => {
      return {
        ret: `hello ${input?.name ?? "world"}`,
      };
    }),

  addKey: publicProcedure
    .input(
      z.object({
        pcd: z.string(),
        pubKeyHex: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[TRPC] addKey`);
      const timeMs = Date.now();
      const sa: StoredAction = { ...input, timeMs, type: "addKey" };
      const user = await feed.verifyExec(sa);
      console.log(`[TRPC] addKey user ${user.uid}`);
      const token = auth.createToken(user.uid);
      return token;
    }),

  act: publicProcedure
    .input(
      z.object({
        uid: z.number(),
        signature: z.string(),
        pubKeyHex: z.string(),
        actionJSON: z.string(),
      })
    )
    .mutation(({ input }) => {
      const timeMs = Date.now();
      feed.verifyExec({ ...input, timeMs, type: "act" });
      return { success: true };
    }),

  globalFeed: publicProcedure.query(() => {
    return feed.genGlobalFeed();
  }),

  user: publicProcedure
    .input(
      z.object({
        uid: z.number(),
      })
    )
    .query(({ input }) => {
      return feed.users[input.uid];
    }),

  thread: publicProcedure
    .input(
      z.object({
        rootID: z.number(),
      })
    )
    .query(({ input }) => {
      return feed.posts.filter((p) => p.rootID === input.rootID);
    }),
});

// export only the type definition of the API
// None of the actual implementation is exposed to the client
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  onError: (ctx) => {
    console.error(`[TRPC] error`, ctx.error);
  },
  createContext: () => ({}),
});
