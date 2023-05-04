import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { User } from "@/common/model";
import { GetServerSidePropsContext } from "next";
import { ZucastAuth } from "./auth";
import { DB } from "./db";
import { ZucastFeed } from "./feed";
import { preloadLatestRoot } from "@/common/crypto";

class ZucastServer {
  db: DB;
  auth: ZucastAuth;
  feed: ZucastFeed;

  constructor() {
    this.db = new DB();
    this.auth = new ZucastAuth();
    this.feed = new ZucastFeed();
  }

  async init() {
    await this.db.createTables();

    // Load auth
    const authTokens = await this.db.loadAuthTokens();
    authTokens.forEach((t) => auth.addToken(t));
    auth.onTokenAdded.on((t) => this.db.saveAuthToken(t));

    // Load feed
    const transactions = await this.db.loadTransactions();
    await feed.init(transactions);
    feed.onTransaction.on(({ id, tx }) => this.db.saveTransaction(id, tx));

    // Verify asynchronoously, in the background
    feed.validate();

    // Preload the latest root periodically, for fast login
    preloadLatestRoot();
    setInterval(preloadLatestRoot, 1000 * 60 * 5);
  }

  /** Cookie authentication */
  authenticateRequest(req: GetServerSidePropsContext["req"]): User | null {
    const token = req.cookies[COOKIE_ZUCAST_TOKEN];
    const loggedInUid = auth.authenticate(token);
    if (loggedInUid == null) return null;
    const { uid, nullifierHash, profile } = feed.loadUser(loggedInUid);
    const user: User = { uid, nullifierHash, profile };
    return user;
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
