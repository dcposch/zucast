import { SerializedPCD } from "@pcd/pcd-types";
import {
  SemaphoreGroupPCD,
  SemaphoreGroupPCDPackage,
  generateMessageHash,
} from "@pcd/semaphore-group-pcd";
import {
  EXTERNAL_NULLIFIER,
  PROFILE_COLORS,
  RATE_LIMIT_ACTIONS_PER_HOUR,
} from "../common/constants";
import { isValidZuzaluMerkleRoot, verifySignature } from "../common/crypto";
import {
  Action,
  NoteSummary,
  Notification,
  Post,
  Thread,
  Transaction,
  TransactionAct,
  TransactionAddKey,
  User,
  actionModel,
} from "../common/model";
import { time } from "../common/util";
import { validatePost, validateProfile } from "../common/validation";
import { TypedEvent } from "./event";

export interface FeedUser extends User {
  /** Public keys for signing actions */
  pubKeys: string[];
  /** Posts by this user */
  posts: FeedPost[];
  /** Recent actions, for rate limiting and ranking. Latest first. */
  recentTransactions: Transaction[];
  /** Posts liked by this user */
  likedPosts: FeedPost[];
  /** Recent notifications for this user. Latest first. */
  recentNotifications: FeedNotification[];
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
  /** Replies in this thread (if parentID == null) */
  replies: FeedPost[];
  /** Number of direct replies */
  nDirectReplies: number;
  /** UIDs that have liked this post */
  likedBy: Set<number>;
  /** Number of likes */
  nLikes: number;
}

interface FeedNotification {
  type: "like" | "reply";
  /** Transaction ID that triggered this */
  txID: number;
  /** Time, in Unix ms */
  timeMs: number;
  /** Post liked or replied to */
  postID: number;
  /** User who liked or replied */
  uid: number;
  /** Reply ID */
  replyPostID?: number;
}

/** Stores the public global feed. */
export class ZucastFeed {
  /** Append-only feed of stored actions. Everything else is derived. */
  private transactions: Transaction[] = [];

  /** Tracks when the action log has been loaded & verified. */
  private state: "new" | "inited" | "validated" = "new";
  /** Event triggered after an action has been verified and executed. */
  onTransaction = new TypedEvent<{ id: number; tx: Transaction }>();

  /** Anonymous users */
  private feedUsers: FeedUser[] = [];
  private feedUsersByNullifierHash: Map<string, FeedUser> = new Map();
  private feedUsersByPubKeyHex: Map<string, FeedUser> = new Map();
  /** Their posts */
  private feedPosts: FeedPost[] = [];

  /** Initializes the feed from a list of stored actions */
  async init(transactions: Transaction[]) {
    if (this.state !== "new") throw new Error("Feed already initialized");

    console.log(`[FEED] initializing feed from ${transactions.length} actions`);
    const elapsedS = await time(async () => {
      for (let id = 0; id < transactions.length; id++) {
        await this.exec(id, transactions[id]);
      }
    });
    this.transactions = transactions;
    this.state = "inited";
    console.log(`[FEED] initialized feed in ${elapsedS.toFixed(1)}s`);
  }

  /** Summarizes feed status */
  getStatus() {
    return {
      state: this.state,
      nActions: this.transactions.length,
      nUsers: this.feedUsers.length,
      nPosts: this.feedPosts.length,
    };
  }

  /** Validates each action in the fee */
  async validate() {
    if (this.state === "new") throw new Error("Feed uninitialized");

    console.log(`[FEED] validating ${this.transactions.length} actions`);
    const elapsedS = await time(async () => {
      for (const action of this.transactions) {
        await this.verify(action);
      }
    });
    console.log(`[FEED] validated feed in ${elapsedS.toFixed(1)}s`);
    this.state = "validated";
  }

  /** Serves the raw append-only action log. */
  loadLog(sinceID: number): Transaction[] {
    return this.transactions.slice(sinceID);
  }

  /** Generates a feed of recent posts, newest to oldest. */
  loadGlobalFeed(authUID: number): Thread[] {
    // The Algorithm™
    const threadIDs = new Set<number>();
    const ret = this.feedPosts
      .slice(-300)
      .reverse()
      .filter((p) => {
        const alreadyIncluded = threadIDs.has(p.rootID);
        threadIDs.add(p.rootID);
        return !alreadyIncluded;
      })
      .slice(0, 100)
      .map((p) => this.feedPosts[p.rootID])
      .map<Thread>((p) => ({
        rootID: p.id,
        posts: p.replies.map((p) => this.toPost(authUID, p)),
      }));
    console.log(`[FEED] generated global feed, ${ret.length} threads`);
    return ret;
  }

  /** Loads all replies to a post, including the original, oldest to newest. */
  loadThread(authUID: number, postID: number): Thread {
    const feedPost = this.feedPosts[postID];
    const rootID = feedPost.rootID;

    // Remove replies to other posts
    // ...keeping only our ancestors
    const ancestors = new Set<number>();
    for (let id: number | undefined = postID; id != null; ) {
      ancestors.add(id);
      id = this.feedPosts[id].parentID;
    }

    // ...and our descendents
    const descendents = new Set<number>([postID]);
    const posts = this.feedPosts[rootID].replies
      .filter((p) => {
        if (p.parentID != null && descendents.has(p.parentID)) {
          descendents.add(p.id);
        }
        return ancestors.has(p.id) || descendents.has(p.id);
      })
      .map((p) => this.toPost(authUID, p));

    return { rootID, posts };
  }

  /** Loads a single post by ID */
  loadPost(authUID: number, postID: number): Post {
    const feedPost = this.feedPosts[postID];
    return this.toPost(authUID, feedPost);
  }

  /** Loads a single user by ID */
  loadUser(uid: number): User {
    const feedUser = this.feedUsers[uid];
    return this.toUser(feedUser);
  }

  loadFeedUser(uid: number): FeedUser {
    return this.feedUsers[uid];
  }

  loadUserPosts(authUID: number, uid: number): Thread[] {
    const feedUser = this.feedUsers[uid];
    return feedUser.posts
      .filter((p) => p.parentID == null)
      .map((p) => ({ rootID: p.rootID, posts: [this.toPost(authUID, p)] }))
      .reverse();
  }

  loadUserReplies(authUID: number, uid: number): Thread[] {
    const feedUser = this.feedUsers[uid];
    return feedUser.posts
      .map((p) => ({ rootID: p.rootID, posts: [this.toPost(authUID, p)] }))
      .reverse();
  }

  loadUserLikes(authUID: number, uid: number): Thread[] {
    const feedUser = this.feedUsers[uid];
    return feedUser.likedPosts
      .map((p) => ({ rootID: p.rootID, posts: [this.toPost(authUID, p)] }))
      .reverse();
  }

  loadLikers(postID: number): User[] {
    const feedPost = this.feedPosts[postID];
    return Array.from(feedPost.likedBy)
      .sort()
      .map((uid) => this.toUser(this.feedUsers[uid]));
  }

  /** Fast-path login. */
  loadUserByPubKey(pubKeyHash: string): User | undefined {
    const feedUser = this.feedUsersByPubKeyHex.get(pubKeyHash);
    return feedUser ? this.toUser(feedUser) : undefined;
  }

  /** Notifications past some recency. */
  loadNotifications(authUID: number, afterTxID: number): Notification[] {
    const feedUser = this.feedUsers[authUID];
    const ix = feedUser.recentNotifications.findIndex(
      (n) => n.txID > afterTxID
    );
    if (ix < 0) return [];

    return feedUser.recentNotifications
      .slice(ix)
      .map((n) => this.toNotification(feedUser, n));
  }

  /** Summarize all recent notifications, no cutoff. */
  loadNoteSummaries(authUID: number): NoteSummary[] {
    const feedUser = this.feedUsers[authUID];
    const notes = feedUser.recentNotifications;

    const ret: NoteSummary[] = [];
    for (const note of notes) {
      switch (note.type) {
        case "reply":
          if (note.replyPostID == null) throw new Error("unreachable");
          ret.push({
            post: this.toPost(authUID, this.feedPosts[note.postID]),
            replyPost: this.toPost(authUID, this.feedPosts[note.replyPostID]),
            likeUsers: [],
          });
          break;
        case "like":
          let sum = ret.find(
            (s) => s.post.id === note.postID && s.replyPost == null
          );
          if (sum == null) {
            sum = {
              post: this.toPost(authUID, this.feedPosts[note.postID]),
              likeUsers: [],
            };
            ret.push(sum);
          }
          sum.likeUsers.push(this.toUser(this.feedUsers[note.uid]));
          break;
      }
    }

    return ret;
  }

  /**
   * Performs an action after validation, including verifying its signature.
   * This is the ONLY public function that modifies the feed.
   */
  async append(tx: Transaction): Promise<User> {
    // Verify
    if (this.state === "new") {
      throw new Error("Feed initializing, try again soon");
    }
    await this.verify(tx);

    // Execute
    const id = this.transactions.length;
    const user = await this.exec(id, tx);

    // Log action, emit event
    this.transactions.push(tx);
    this.onTransaction.emit({ id, tx });

    return user;
  }

  /**
   * Verifies the cryptographic signature or proof for an action.
   * This has NO effect on the feed--see exec() for that.
   */
  private async verify(tx: Transaction) {
    const { type } = tx;
    switch (type) {
      case "addKey":
        return await this.verifyAddKey(tx);
      case "act":
        return await this.verifyAct(tx);
      default:
        throw new Error(`Invalid stored action type ${type}`);
    }
  }

  /** Executes an already-verified action. */
  private async exec(txID: number, tx: Transaction): Promise<User> {
    const { type } = tx;
    const feedUser = await (() => {
      switch (type) {
        case "addKey":
          return this.execAddKey(tx);
        case "act":
          return this.execAct(txID, tx);
        default:
          throw new Error(`Invalid stored action type ${type}`);
      }
    })();

    return this.toUser(feedUser);
  }

  /**
   * Verifies a zero-knowledge proof PCD, then checks that the proof references
   * a valid merkle root.
   */
  private async verifyAddKey(tx: TransactionAddKey) {
    // Parse and verify the PCD
    const serPCD = JSON.parse(tx.pcd) as SerializedPCD;

    console.log(`[FEED] addKey verifying ${serPCD.type}`);
    console.log(serPCD.pcd);
    const pcd = await SemaphoreGroupPCDPackage.deserialize(serPCD.pcd);
    const valid = await SemaphoreGroupPCDPackage.verify(pcd);

    // Validate PCD contents
    if (!valid) {
      throw new Error(`Invalid PCD, ignoring addKey`);
    } else if (pcd.claim.externalNullifier !== "" + EXTERNAL_NULLIFIER) {
      throw new Error(`Wrong externalNullifier, ignoring addKey`);
    } else if (pcd.claim.signal !== "" + generateMessageHash(tx.pubKeyHex)) {
      throw new Error(`Wrong signal, ignoring addKey`);
    } else if (!(await isValidZuzaluMerkleRoot(pcd.claim.merkleRoot))) {
      throw new Error(`Invalid Zuzalu merkle root, ignoring addKey`);
    }
  }

  /**
   * Adds a signing pubkey to the anonymous user (identified  by nullifierHash).'
   * Creates a new user if necessary.
   */
  private async execAddKey(tx: TransactionAddKey) {
    // Load previously-verified PCD
    const serPCD = JSON.parse(tx.pcd) as SerializedPCD;
    const pcd = await SemaphoreGroupPCDPackage.deserialize(serPCD.pcd);

    // Disallow duplicate keys
    if (this.feedUsersByPubKeyHex.has(tx.pubKeyHex)) {
      throw new Error(`Pubkey already exists, ignoring addKey ${tx.pubKeyHex}`);
    }

    // Create a new user if necessary
    let feedUser = this.feedUsersByNullifierHash.get(pcd.claim.nullifierHash);
    if (feedUser == null) {
      feedUser = this.createUser(pcd);
    }

    // Either way, add a pubKey to the user
    feedUser.pubKeys.push(tx.pubKeyHex);
    this.feedUsersByPubKeyHex.set(tx.pubKeyHex, feedUser);

    return feedUser;
  }

  /** Creates a new user from an already-verified PCD */
  private createUser(pcd: SemaphoreGroupPCD) {
    console.log(`[FEED] new user ${pcd.claim.nullifierHash}`);
    const ret: FeedUser = {
      uid: this.feedUsers.length,
      nullifierHash: pcd.claim.nullifierHash,
      // Everyone starts as an egg
      profile: { color: PROFILE_COLORS[2], emoji: "🥚" },
      pubKeys: [],
      posts: [],
      recentTransactions: [],
      likedPosts: [],
      recentNotifications: [],
    };
    this.feedUsers.push(ret);
    this.feedUsersByNullifierHash.set(pcd.claim.nullifierHash, ret);
    return ret;
  }

  /** Verifies a signing-key signature, then records the (post, like, etc) */
  private async verifyAct(tx: TransactionAct) {
    const feedUser = this.feedUsers[tx.uid];
    if (!feedUser) {
      throw new Error("Ignoring action, uid not found");
    }

    // Verify
    if (!feedUser.pubKeys.includes(tx.pubKeyHex)) {
      throw new Error("Ignoring action, signing pubKey not found");
    }
    await verifySignature(tx.pubKeyHex, tx.signature, tx.actionJSON);
  }

  /** Executes an already-verified user action. */
  private async execAct(txID: number, tx: TransactionAct) {
    const feedUser = this.feedUsers[tx.uid];

    // Record user action
    const recents = feedUser.recentTransactions;
    recents.unshift(tx);
    const t1HBefore = tx.timeMs - 60 * 60 * 1000;
    while (recents.length && recents[recents.length - 1].timeMs < t1HBefore) {
      recents.pop();
    }
    if (recents.length >= RATE_LIMIT_ACTIONS_PER_HOUR) {
      throw new Error("Rate limit exceeded");
    }

    // Try to execute the action
    const action = actionModel.parse(JSON.parse(tx.actionJSON));
    this.execUserAction(feedUser, action, txID, tx.timeMs);

    return feedUser;
  }

  /** Executes and already-verified user action, such as a new post. */
  private execUserAction(
    feedUser: FeedUser,
    action: Action,
    txID: number,
    timeMs: number
  ) {
    const { type } = action;
    const { uid } = feedUser;
    switch (type) {
      case "post": {
        const { content, parentID } = action;
        const post = this.execPost(feedUser, timeMs, content, parentID);
        if (parentID != null) this.notifyReply(txID, timeMs, uid, post.id);
        break;
      }

      case "like": {
        const { postID } = action;
        this.execLike(feedUser, postID, 1);
        this.notify("like", txID, timeMs, uid, postID);
        break;
      }

      case "unlike": {
        const { postID } = action;
        this.execLike(feedUser, postID, -1);
        this.notify("unlike", txID, timeMs, uid, postID);
        break;
      }

      case "saveProfile": {
        console.log(`[FEED] saveProfile ${feedUser.uid}`);
        feedUser.profile = validateProfile(action.profile);
      }

      default:
        console.warn(`[FEED] ignoring action ${type}`);
    }
  }

  /** Saves an already-verified new post or reply */
  private execPost(
    feedUser: FeedUser,
    timeMs: number,
    content: string,
    parentID?: number
  ) {
    const id = this.feedPosts.length;
    const contentJSON = JSON.stringify(content);
    console.log(`[FEED] NEW POST ${id} by ${feedUser.uid}: ${contentJSON}`);

    let rootID = id;
    if (parentID != null && this.feedPosts[parentID]) {
      rootID = this.feedPosts[parentID].rootID;
    }
    let feedPost: FeedPost = {
      id,
      uid: feedUser.uid,
      timeMs: timeMs,
      content,
      parentID,
      rootID,
      replies: [],
      nDirectReplies: 0,
      likedBy: new Set(),
      nLikes: 0,
    };

    // Validate
    if (parentID != null && this.feedPosts[parentID] == null) {
      throw new Error("Ignoring post, bad parentID");
    }
    validatePost(content);

    this.feedPosts.push(feedPost);
    this.feedUsers[feedUser.uid].posts.push(feedPost);
    this.feedPosts[feedPost.rootID].replies.push(feedPost);

    if (feedPost.parentID != null) {
      this.feedPosts[feedPost.parentID].nDirectReplies++;
    }

    return feedPost;
  }

  /** Executes an already-verified like or unlike */
  private execLike(feedUser: FeedUser, postID: number, delta: 1 | -1) {
    const { uid } = feedUser;
    console.log(`[FEED] ${uid} ${delta > 0 ? "like" : "unlike"} ${postID}`);

    const feedPost = this.feedPosts[postID];
    if (!feedPost) {
      throw new Error("Ignoring like, post not found");
    }

    if (delta > 0) {
      if (feedPost.likedBy.has(uid)) {
        throw new Error("Ignoring like, already liked");
      }
      feedPost.likedBy.add(uid);
      feedUser.likedPosts.push(feedPost);
    } else {
      if (!feedPost.likedBy.has(uid)) {
        throw new Error("Ignoring unlike, no like found");
      }
      feedPost.likedBy.delete(uid);
      const ix = feedUser.likedPosts.indexOf(feedPost);
      if (ix >= 0) feedUser.likedPosts.splice(ix, 1);
    }
    feedPost.nLikes += delta;
  }

  /** Notifies certain parent (& grandparent, etc) posters of a reply. */
  notifyReply(txID: number, timeMs: number, uid: number, postID: number) {
    const post = this.feedPosts[postID];

    // Find ancestor posts. Root first, direct parent last.
    const ancestors: FeedPost[] = [];
    let aid: number | undefined;
    for (aid = post.parentID; aid != null; aid = ancestors[0].parentID) {
      ancestors.unshift(this.feedPosts[aid]);
    }

    // Notify each user we're replying to exactly once, except ourselves.
    const notifiedUserIDs = new Set<number>([uid]);
    for (const ancestor of ancestors) {
      if (notifiedUserIDs.has(ancestor.uid)) continue;
      notifiedUserIDs.add(ancestor.uid);
      this.notify("reply", txID, timeMs, uid, ancestor.id, postID);
    }
  }

  /** Adds or removes a notification */
  private notify(
    type: "reply" | "like" | "unlike",
    txID: number,
    timeMs: number,
    uid: number,
    postID: number,
    replyPostID?: number
  ) {
    const affectedPost = this.feedPosts[postID];
    if (!affectedPost) throw new Error(`Invalid post ${postID}`);
    const affectedFeedUser = this.feedUsers[affectedPost.uid];

    if (type === "unlike") {
      // Remove latest like notification, if present
      const ix = affectedFeedUser.recentNotifications.findIndex(
        (n) => n.type === "like" && n.postID == postID && n.uid == uid
      );
      if (ix >= 0) {
        affectedFeedUser.recentNotifications.splice(ix, 1);
      }
      return;
    }

    // Add notification
    affectedFeedUser.recentNotifications.unshift({
      type,
      postID,
      timeMs,
      txID,
      uid,
      replyPostID,
    });
    while (affectedFeedUser.recentNotifications.length > 100) {
      affectedFeedUser.recentNotifications.pop();
    }
  }

  /** Extracts API-facing data */
  private toUser(feedUser: FeedUser): User {
    const { uid, nullifierHash, profile } = feedUser;
    return { uid, nullifierHash, profile };
  }

  /** Hydrates API-facing data */
  private toPost = (authUID: number, feedPost: FeedPost) => {
    const user = this.toUser(this.feedUsers[feedPost.uid]);
    const { id, timeMs, content, rootID, parentID } = feedPost;
    const { nDirectReplies, nLikes } = feedPost;

    const ret: Post = {
      authUID,
      id,
      user,
      timeMs,
      content,
      rootID,
      nDirectReplies,
      liked: feedPost.likedBy.has(authUID),
      nLikes,
    };

    if (parentID != null) {
      ret.parentID = parentID;
      ret.parentUID = this.feedPosts[parentID].uid;
    }
    return ret;
  };

  /** Hydrates API-facing data */
  private toNotification = (authUser: FeedUser, n: FeedNotification) => {
    const ret: Notification = {
      type: n.type,
      post: this.toPost(authUser.uid, this.feedPosts[n.postID]),
      timeMs: n.timeMs,
      txID: n.txID,
      user: this.toUser(this.feedUsers[n.uid]),
    };

    return ret;
  };
}
