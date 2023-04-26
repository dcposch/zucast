import { EXTERNAL_NULLIFIER } from "@/common/constants";
import {
  SemaphoreGroupPCDPackage,
  generateMessageHash,
} from "@pcd/semaphore-group-pcd";
import {
  Action,
  Post,
  StoredAction,
  StoredActionAct,
  StoredActionAddKey,
  User,
  actionModel as actionModel,
} from "../common/model";
import { verifySignature } from "@/common/crypto";
import { SerializedPCD } from "@pcd/pcd-types";

export interface FeedUser extends User {
  /** Public keys for signing actions */
  pubKeys: string[];
  /** Posts by this user */
  posts: Post[];
  /** Recent actions, for rate limiting and ranking. */
  recentActions: StoredAction[];
}

/** Stores the public global feed. */
export class ZucastFeed {
  /** Append-only feed of stored actions. Everything else is derived. */
  sas: StoredAction[] = [];
  /** Anonymous users */
  users: FeedUser[] = [];
  usersByNullifierHash: Map<string, FeedUser> = new Map();
  /** Their posts */
  posts: Post[] = [];

  /** Generates a feed of recent posts */
  genGlobalFeed() {
    return this.posts.slice(-100).reverse();
  }

  /** Performs an action after validation, including verifying its signature. */
  async verifyExec(sa: StoredAction): Promise<FeedUser> {
    const { type } = sa;
    const user = await (() => {
      switch (type) {
        case "addKey":
          return this.verifyExecAddKey(sa);
        case "act":
          return this.verifyExecAct(sa);
        default:
          throw new Error(`[FEED] invalid stored action ${type}`);
      }
    })();
    this.sas.push(sa);
    return user;
  }

  private async verifyExecAddKey(sa: StoredActionAddKey) {
    // Parse and verify the PCD
    const serPCD = JSON.parse(sa.pcd) as SerializedPCD;
    console.log(`[FEED] addKey verifying ${serPCD.type}`);
    console.log(serPCD.pcd);
    const pcd = await SemaphoreGroupPCDPackage.deserialize(serPCD.pcd);
    console.log(`WTF ${pcd.type}`);
    const valid = await SemaphoreGroupPCDPackage.verify(pcd);
    if (!valid) {
      throw new Error(`[FEED] invalid PCD, ignoring addKey`);
    } else if (pcd.claim.externalNullifier !== "" + EXTERNAL_NULLIFIER) {
      throw new Error(`[FEED] wrong externalNullifier, ignoring addKey`);
    } else if (pcd.claim.signal !== "" + generateMessageHash(sa.pubKeyHex)) {
      throw new Error(`[FEED] wrong signal, ignoring addKey`);
    }

    let user = this.usersByNullifierHash.get(pcd.claim.nullifierHash);
    if (user == null) {
      console.log(`[FEED] new user ${pcd.claim.nullifierHash}`);
      user = {
        uid: this.users.length,
        nullifierHash: pcd.claim.nullifierHash,
        profile: {
          color: "#99bb99",
          emoji: "🥚",
        },
        pubKeys: [],
        posts: [],
        recentActions: [],
      };
      this.users.push(user);
      this.usersByNullifierHash.set(pcd.claim.nullifierHash, user);
    }
    user.pubKeys.push(sa.pubKeyHex);
    return user;
  }

  private async verifyExecAct(sa: StoredActionAct) {
    const user = this.users[sa.uid];
    if (!user) throw new Error("[FEED] action uid not found");

    // Verify
    if (!user.pubKeys.includes(sa.pubKeyHex)) {
      throw new Error("[FEED] action pubKey not found");
    }
    await verifySignature(sa.pubKeyHex, sa.signature, sa.actionJSON);
    user.recentActions.unshift(sa);

    // Rate limit
    const t1h = Date.now() + 60 * 60 * 1000;
    while (user.recentActions[user.recentActions.length - 1].timeMs < t1h) {
      user.recentActions.pop();
    }
    if (user.recentActions.length > 50) {
      throw new Error("[FEED] rate limit exceeded");
    }

    // Execute
    const action = actionModel.parse(sa.actionJSON);
    this.executeUserAction(user, action, sa.timeMs);

    return user;
  }

  /** Executes and already-verified user action, such as a new post. */
  private executeUserAction(user: FeedUser, action: Action, timeMs: number) {
    const { type } = action;
    switch (type) {
      case "post":
        const id = this.posts.length;
        let rootID = id;
        if (action.parentID != null && this.posts[action.parentID]) {
          rootID = this.posts[action.parentID].rootID;
        }
        const post = {
          id,
          uid: user.uid,
          timeMs: timeMs,
          content: action.content,
          rootID,
        };
        this.posts.push(post);
        this.users[user.uid].posts.push(post);
        break;

      case "like":
        console.warn("[FEED] like unimplemented");
        // TODO
        break;

      default:
        console.warn(`[FEED] ignoring action ${type}`);
    }
  }
}

// NextJS workaround.
export const feed = (function () {
  const key = "ZucastFeed";
  let auth = (global as any)[key] as ZucastFeed;
  if (!auth) {
    auth = (global as any)[key] = new ZucastFeed();
  }
  return auth;
})();
