import { z } from "zod";
import { feed } from "./feed";
import { User } from "@/common/model";
import crypto from "crypto";

interface Token {
  cookie: string;
  uid: number;
  createdMs: number;
}

/** Cookie authentication for view only. All actions are individually signed. */
export class ZucastAuth {
  /** List of active tokens. Everything else is derived. */
  tokens: Token[] = [];
  /** Map from cookie to logged-in user. */
  tokenMap: Map<string, Token> = new Map();

  wtf = (() => {
    const id = (Math.random() * 1e6) | 0;
    console.log(`[AUTH] wtf ${id} ${global["test"]}`);
    return id;
  })();

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
      console.log(`WTF ${this.wtf} ${[...this.tokenMap.keys()].join(", ")}`);
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

// TODO: remove
const tokenModel = z.object({
  uid: z.number(),
  exp: z.number(),
  sig: z.string(),
  pubKey: z.string(),
});

// TODO: add sigpcd verifier

// TODO: turn this into a signed-action verifier
export async function verifyToken(token?: string): Promise<User | undefined> {
  if (!token) return undefined;

  let uid = null as number | null;
  try {
    // Parse token
    const payload = JSON.parse(token);
    const tok = tokenModel.parse(payload);
    uid = tok.uid;
    const { exp, sig, pubKey } = tok;

    // Verify ECDSA signature
    const algo = { name: "ECDSA", namedCurve: "P-256" };
    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(pubKey, "base64"),
      algo,
      false,
      ["verify"]
    );
    const expectedSignedMessage = Buffer.from("zucast" + exp);
    const verified = await crypto.subtle.verify(
      algo,
      key,
      Buffer.from(sig, "base64"),
      expectedSignedMessage
    );
    if (!verified) {
      throw new Error("[AUTH] invalid signature");
    }

    // Verify user
    const user = feed.users[uid];
    if (user == null || !user.pubKeys.includes(pubKey)) {
      throw new Error("[AUTH] wrong public key for uid");
    }

    // Verify expiration
    if (Date.now() > exp) {
      throw new Error("[AUTH] expired token");
    }

    return user;
  } catch (e: any) {
    console.error(`[AUTH] invalid token for ${uid}: ${e?.message}`);
    console.error(e);
    return undefined;
  }
}
