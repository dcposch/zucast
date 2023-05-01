import crypto from "crypto";
import { TypedEvent } from "./event";

export interface AuthToken {
  cookie: string;
  uid: number;
  createdMs: number;
}

/** Cookie authentication for view only. All actions are individually signed. */
export class ZucastAuth {
  /** List of active tokens. Everything else is derived. */
  tokens: AuthToken[] = [];
  /** Map from cookie to logged-in user. */
  tokenMap: Map<string, AuthToken> = new Map();
  /** Event triggered after a new token has been added. */
  onTokenAdded = new TypedEvent<AuthToken>();

  createToken(uid: number): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const cookie = Buffer.from(randomBytes).toString("base64");
    const createdMs = Date.now();
    console.log(`[AUTH] create token ${cookie} for ${uid}`);
    this.addToken({ cookie, uid, createdMs });
    return cookie;
  }

  addToken(token: AuthToken) {
    this.tokens.push(token);
    this.tokenMap.set(token.cookie, token);
    this.onTokenAdded.emit(token);
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
