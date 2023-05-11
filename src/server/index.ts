import { COOKIE_ZUCAST_TOKEN } from "../common/constants";
import { User } from "../common/model";
import { GetServerSidePropsContext } from "next";
import { ZucastAuth } from "./auth";
import { DB } from "./db";
import { ZucastFeed } from "./feed";
import { calcPostShareToken, preloadLatestRoot } from "../common/crypto";

interface InitStatus {
  elapsedMs: number;
  error?: string;
}

class ZucastServer {
  db: DB;
  auth: ZucastAuth;
  feed: ZucastFeed;

  private initStatus: { load?: InitStatus; validate?: InitStatus } = {};
  private initResolve = () => {};
  private initPromise = new Promise<void>((res) => {
    this.initResolve = res;
  });

  constructor() {
    this.db = new DB();
    this.auth = new ZucastAuth();
    this.feed = new ZucastFeed();
  }

  waitForInit() {
    return this.initPromise;
  }

  async init() {
    // Load append-only transaction log, init data structures.
    this.initStatus.load = await status(() => this.load());

    // Verify each tx asynchronoously, in the background
    if (process.env.ZUCAST_NO_VALIDATE !== "1") {
      status(() => feed.validate()).then((s) => (this.initStatus.validate = s));
    }

    // Preload the latest merkle root periodically, for fast login
    preloadLatestRoot();
    setInterval(preloadLatestRoot, 1000 * 60 * 5);

    this.initResolve();
  }

  private async load() {
    await this.db.createTables();

    // Load auth
    const authTokens = await this.db.loadAuthTokens();
    authTokens.forEach((t) => auth.addToken(t));
    auth.onTokenAdded.on((t) => this.db.saveAuthToken(t));

    // Load feed
    const transactions = await this.db.loadTransactions();
    await feed.init(transactions);
    feed.onTransaction.on(({ id, tx }) => this.db.saveTransaction(id, tx));
  }

  /** Cookie authentication */
  async authenticateRequest(req: GetServerSidePropsContext["req"]) {
    const token = req.cookies[COOKIE_ZUCAST_TOKEN];
    await this.waitForInit();

    const loggedInUid = auth.authenticate(token);
    if (loggedInUid == null) return null;

    const { uid, nullifierHash, profile } = feed.loadUser(loggedInUid);
    const user: User = { uid, nullifierHash, profile };
    return user;
  }

  /** Share link authentication */
  async authPostShareToken(share: string, postID: number): Promise<boolean> {
    // Share token is simply the hash of the post so far.
    // (Logged-out user could guess only if they know the exact thread already.)
    const post = feed.loadFeedPost(postID);
    if (!post) return false;
    return share === (await calcPostShareToken(post));
  }

  /** Status monitoring */
  getStatus() {
    return {
      init: this.initStatus,
      db: this.db.getStatus(),
      auth: {
        nTokens: this.auth.tokens.length,
      },
      feed: this.feed.getStatus(),
    };
  }
}

/** Tracks how long initialization takes, and whether there was an error.
 * For any detail beyond this I'd add Honeycomb, if needed. */
async function status(func: () => Promise<void>): Promise<InitStatus> {
  const start = performance.now();
  try {
    await func();
    return { elapsedMs: (performance.now() - start) | 0 };
  } catch (e: any) {
    console.error(`[SERVER] error during init`, e);
    const error = e?.message || "Unknown error";
    return { elapsedMs: (performance.now() - start) | 0, error };
  }
}

// NextJS workaround.
export const server = (function () {
  const key = "ZucastServer";
  let server = (global as any)[key] as ZucastServer;
  if (!server) {
    server = (global as any)[key] = new ZucastServer();

    console.log("[SERVER] init");
    server
      .init()
      .then(() => console.log("[SERVER] initialized"))
      .catch((err) => {
        console.error("[SERVER] init failed", err);
        process.exit(1);
      });
  }

  return server;
})();

export const auth = server.auth;
export const feed = server.feed;
