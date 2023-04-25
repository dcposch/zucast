import { StoredAction, User, Post, Action } from "../common/model";

/** Stores the public global feed. */
export class ZucastFeed {
  /** Append-only feed of stored actions. Everything else is derived. */
  sas: StoredAction[] = [];
  /** Anonymous users */
  users: User[] = [];
  /** Their posts */
  posts: Post[] = [];

  /** Generates a feed of recent posts */
  genGlobalFeed() {
    return this.posts.slice(-100).reverse();
  }

  /** Adds a single action after verifying its signature. */
  async verifyAndAdd(sa: StoredAction): Promise<User> {
    const { type } = sa;
    switch (type) {
      case "act": {
        const user = this.users[sa.uid];
        if (!user) throw new Error("[FEED] action uid not found");
        // TODO: verify signature
        // TODO: per-user rate limit
        this.executeUserAction(user, sa.action, sa.timeMs);
        return user;
      }

      case "addKey": {
        // TODO: parse and verify PCD
        const user: User = {
          uid: this.users.length,
          nullifierHash: sa.pcd,
          pubKeys: [],
          posts: [],
        };
        this.users.push(user);
        return user;
      }

      default:
        throw new Error(`[FEED] invalid stored action ${type}`);
    }
  }

  /** Executes and already-verified user action, such as a new post. */
  private executeUserAction(user: User, action: Action, timeMs: number) {
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
