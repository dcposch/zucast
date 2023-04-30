import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { User } from "@/common/model";
import crypto from "crypto";
import { GetServerSidePropsContext } from "next";
import { feed } from "./feed";

interface Token {
  cookie: string;
  uid: number;
  createdMs: number;
}

/** Cookie authentication */
export function authenticateRequest(
  req: GetServerSidePropsContext["req"]
): User | null {
  const token = req.cookies[COOKIE_ZUCAST_TOKEN];
  const loggedInUid = auth.authenticate(token);
  if (loggedInUid == null) return null;
  const { uid, nullifierHash, profile } = feed.loadUser(loggedInUid);
  const user: User = { uid, nullifierHash, profile };
  return user;
}

/** Cookie authentication for view only. All actions are individually signed. */
export class ZucastAuth {
  /** List of active tokens. Everything else is derived. */
  tokens: Token[] = [];
  /** Map from cookie to logged-in user. */
  tokenMap: Map<string, Token> = new Map();

  createToken(uid: number): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const cookie = Buffer.from(randomBytes).toString("base64");
    const createdMs = Date.now();
    this.addToken({ cookie, uid, createdMs });
    return cookie;
  }

  addToken(token: Token) {
    console.log(`[AUTH] add token ${token.cookie} for ${token.uid}`);
    this.tokens.push(token);
    this.tokenMap.set(token.cookie, token);
  }

  authenticate(cookie?: string): number | null {
    if (!cookie) return null;
    const token = this.tokenMap.get(cookie);
    if (!token) {
      console.log(`[AUTH] token not found ${cookie}`);
      return null;
    }
    return token.uid;
  }
}

// NextJS workaround.
export const auth = (function () {
  const key = "ZucastAuth";
  let auth = (global as any)[key] as ZucastAuth;
  if (!auth) {
    auth = (global as any)[key] = new ZucastAuth();
  }
  return auth;
})();
