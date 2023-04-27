import {
  EXTERNAL_NULLIFIER,
  RATE_LIMIT_ACTIONS_PER_HOUR,
} from "@/common/constants";
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
import { validatePost, validateProfile } from "@/common/validation";

export interface FeedUser extends User {
  /** Public keys for signing actions */
  pubKeys: string[];
  /** Posts by this user */
  posts: FeedPost[];
  /** Recent actions, for rate limiting and ranking. */
  recentActions: StoredAction[];
}

interface FeedPost {
  id: number;
  /** User who posted this */
  uid: number;
  /** Time, in Unix ms */
  timeMs: number;
  /** Post content */
  content: string;
  /** Root ID = ID of this post or highest ancestor */
  rootID: number;
  /** Parent ID, or undefined if this is not a reply */
  parentID?: number;
}

/** Stores the public global feed. */
export class ZucastFeed {
  /** Append-only feed of stored actions. Everything else is derived. */
  private storedActions: StoredAction[] = [];
  /** Anonymous users */
  private feedUsers: FeedUser[] = [];
  private feedUsersByNullifierHash: Map<string, FeedUser> = new Map();
  /** Their posts */
  private feedPosts: FeedPost[] = [];

  /** Generates a feed of recent posts, newest to oldest. */
  loadGlobalFeed(): Post[] {
    const ret = this.feedPosts.slice(-100).reverse().map(this.toPost);
    console.log(`[FEED] generated global feed, ${ret.length} posts`);
    return ret;
  }

  /** Loads all replies to a post, oldest to newest. */
  loadThread(rootID: number): Post[] {
    return this.feedPosts.filter((p) => p.rootID === rootID).map(this.toPost);
  }

  /** Loads a single post by ID */
  loadPost(postID: number): Post {
    const feedPost = this.feedPosts[postID];
    return this.toPost(feedPost);
  }

  /** Loads a single user by ID */
  loadUser(uid: number): User {
    const feedUser = this.feedUsers[uid];
    return this.toUser(feedUser);
  }

  loadFeedUser(uid: number): FeedUser {
    return this.feedUsers[uid];
  }

  loadUserPosts(uid: number): Post[] {
    const feedUser = this.feedUsers[uid];
    return feedUser.posts
      .filter((p) => p.parentID == null)
      .reverse()
      .map(this.toPost);
  }

  loadUserReplies(uid: number): Post[] {
    const feedUser = this.feedUsers[uid];
    return feedUser.posts.slice().reverse().map(this.toPost);
  }

  /** Performs an action after validation, including verifying its signature. */
  async verifyExec(sa: StoredAction): Promise<User> {
    const { type } = sa;
    const feedUser = await (() => {
      switch (type) {
        case "addKey":
          return this.verifyExecAddKey(sa);
        case "act":
          return this.verifyExecAct(sa);
        default:
          throw new Error(`Invalid stored action type ${type}`);
      }
    })();

    this.storedActions.push(sa);
    return this.toUser(feedUser);
  }

  /**
   * Verifies a zero-knowledge proof, then adds a signing pubkey to the
   * anonymous user (identified only by nullifierHash). Creates a new user if
   * necessary.
   */
  private async verifyExecAddKey(sa: StoredActionAddKey) {
    // Parse and verify the PCD
    const serPCD = JSON.parse(sa.pcd) as SerializedPCD;
    console.log(`[FEED] addKey verifying ${serPCD.type}`);
    console.log(serPCD.pcd);
    const pcd = await SemaphoreGroupPCDPackage.deserialize(serPCD.pcd);
    const valid = await SemaphoreGroupPCDPackage.verify(pcd);
    if (!valid) {
      throw new Error(`Invalid PCD, ignoring addKey`);
    } else if (pcd.claim.externalNullifier !== "" + EXTERNAL_NULLIFIER) {
      throw new Error(`Wrong externalNullifier, ignoring addKey`);
    } else if (pcd.claim.signal !== "" + generateMessageHash(sa.pubKeyHex)) {
      throw new Error(`Wrong signal, ignoring addKey`);
    }

    let feedUser = this.feedUsersByNullifierHash.get(pcd.claim.nullifierHash);
    if (feedUser == null) {
      console.log(`[FEED] new user ${pcd.claim.nullifierHash}`);
      feedUser = {
        uid: this.feedUsers.length,
        nullifierHash: pcd.claim.nullifierHash,
        profile: {
          color: "#99bb99",
          emoji: "🥚",
        },
        pubKeys: [],
        posts: [],
        recentActions: [],
      };
      this.feedUsers.push(feedUser);
      this.feedUsersByNullifierHash.set(pcd.claim.nullifierHash, feedUser);
    }
    feedUser.pubKeys.push(sa.pubKeyHex);
    return feedUser;
  }

  /** Verifies a signing-key signature, then records the (post, like, etc) */
  private async verifyExecAct(sa: StoredActionAct) {
    const feedUser = this.feedUsers[sa.uid];
    if (!feedUser) {
      throw new Error("Ignoring action, uid not found");
    }

    // Verify
    if (!feedUser.pubKeys.includes(sa.pubKeyHex)) {
      throw new Error("Ignoring action, signing pubKey not found");
    }
    await verifySignature(sa.pubKeyHex, sa.signature, sa.actionJSON);

    // Rate limit
    const t1h = Date.now() - 60 * 60 * 1000;
    const recents = feedUser.recentActions;
    while (recents.length && recents[recents.length - 1].timeMs < t1h) {
      recents.pop();
    }
    if (recents.length > RATE_LIMIT_ACTIONS_PER_HOUR) {
      throw new Error("Rate limit exceeded");
    }

    // Record user action
    recents.unshift(sa);

    // Finally, try to execute the action
    const action = actionModel.parse(JSON.parse(sa.actionJSON));
    this.executeUserAction(feedUser, action, sa.timeMs);

    return feedUser;
  }

  /** Executes and already-verified user action, such as a new post. */
  private executeUserAction(
    feedUser: FeedUser,
    action: Action,
    timeMs: number
  ) {
    const { type } = action;
    switch (type) {
      case "post":
        const id = this.feedPosts.length;
        let rootID = id;
        if (action.parentID != null && this.feedPosts[action.parentID]) {
          rootID = this.feedPosts[action.parentID].rootID;
        }
        let feedPost: FeedPost = {
          id,
          uid: feedUser.uid,
          timeMs: timeMs,
          content: action.content,
          parentID: action.parentID,
          rootID,
        };

        // Validate
        if (action.parentID != null && !this.loadPost(action.parentID)) {
          throw new Error("Ignoring post, bad parentID");
        }
        validatePost(action.content);

        const contentJSON = JSON.stringify(action.content);
        console.log(`[FEED] NEW POST ${id} by ${feedUser.uid}: ${contentJSON}`);

        this.feedPosts.push(feedPost);
        this.feedUsers[feedUser.uid].posts.push(feedPost);
        break;

      case "like":
        console.warn("[FEED] like unimplemented");
        // TODO
        break;

      case "saveProfile":
        console.warn(`[FEED] saveProfile ${feedUser.uid}`);
        feedUser.profile = validateProfile(action.profile);

      default:
        console.warn(`[FEED] ignoring action ${type}`);
    }
  }

  /** Extracts API-facing data */
  private toUser(user: FeedUser): User {
    const { uid, nullifierHash, profile } = user;
    return { uid, nullifierHash, profile };
  }

  /** Hydrates API-facing data */
  private toPost = (post: FeedPost) => {
    const user = this.toUser(this.feedUsers[post.uid]);
    const { id, timeMs, content, rootID, parentID } = post;
    const ret: Post = { id, user, timeMs, content, rootID };
    if (parentID != null) ret.parentID = parentID;
    return ret;
  };
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
