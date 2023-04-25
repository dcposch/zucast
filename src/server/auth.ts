import {z} from "zod";

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

    createToken(uid: number): string {
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const cookie = Buffer.from(randomBytes).toString("base64");
        const createdMs = Date.now();
        this.addToken({cookie, uid, createdMs});
        return cookie;
    }

    addToken(token: Token) {
        this.tokens.push(token);
        this.tokenMap.set(token.cookie, token);
    }

    authenticate(cookie?: string): number|undefined {
        if (!cookie) return undefined;
        const token = this.tokenMap.get(cookie);
        if (!token) return undefined;
        return token.uid;
    }
}

export const auth = new ZucastAuth();

// TODO: remove
const tokenModel = z.object({
    uid: z.number(),
    exp: z.number(),
    sig: z.string(),
    pubKey: z.string(),
    });

    // TODO: add sigpcd verifier

    // TODO: turn this into a signed-action verifier
export async function verifyToken(token?: string): Promise<number | undefined> {
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
      if (!verified){
         throw new Error("Invalid signature");
      }
  
      // Verify 
      if (Date.now() > exp) {
        throw new Error("Expired token");
      }
  
      const user = feed.
  
      return uid;
    } catch (e: any) {
      console.error(`[AUTH] invalid token for ${uid}: ${e?.message}`);
      console.error(e);
      return undefined;
    }
  }