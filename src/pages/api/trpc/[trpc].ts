/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import { StoredAction } from "@/common/model";
import { feed, auth } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";

const appRouter = router({
  login: publicProcedure
    .input(
      z.object({
        pcd: z.string(),
        pubKeyHex: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[TRPC] login request for ${input.pubKeyHex}`);

      let user = feed.loadUserByPubKey(input.pubKeyHex);
      if (user == null) {
        console.log(`[TRPC] login creating new user`);
        const timeMs = Date.now();
        const sa: StoredAction = { ...input, timeMs, type: "addKey" };
        user = await feed.append(sa);
      }

      console.log(`[TRPC] login success, creating token for user ${user.uid}`);
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
    .mutation(async ({ input }) => {
      const timeMs = Date.now();
      await feed.append({ ...input, timeMs, type: "act" });
      return { success: true };
    }),

  loadUser: publicProcedure
    .input(
      z.object({
        uid: z.number(),
      })
    )
    .query(({ input }) => {
      return feed.loadUser(input.uid);
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
