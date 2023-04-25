/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { ZucastFeed } from "@/server/feed";
import { action } from "@/server/model";

const feed = new ZucastFeed();

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
      })
    )
    .mutation(({ input }) => {
      const timeMs = Date.now();
      feed.addStoredAction({ ...input, timeMs, type: "addKey" });
    }),

  act: publicProcedure
    .input(
      z.object({
        uid: z.number(),
        signature: z.string(),
        action,
      })
    )
    .mutation(({ input }) => {
      const timeMs = Date.now();
      // TODO: validate and add
      feed.addStoredAction({ ...input, timeMs, type: "act" });
      return "ok";
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
  createContext: () => ({}),
});
