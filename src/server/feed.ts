import { StoredAction, User, Post, Action } from "./model";

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

  /** Adds a single action */
  async addStoredAction(sa: StoredAction) {
    const { type } = sa;
    switch (type) {
      case "act":
        const user = this.users[sa.uid];
        if (!user) throw new Error("User not found");
        // TODO: verify signature
        this.addAction(sa.action, sa.timeMs, user);
        break;

      case "addKey":
        // TODO: parse and verify PCD
        this.users.push({
          uid: this.users.length,
          nullifierHash: sa.pcd,
          pubKeys: [],
          posts: [],
        });
        break;

      default:
        console.log(`[FEED] ignoring stored action ${type}`);
    }
  }

  addAction(action: Action, timeMs: number, user: User) {
    switch (action.type) {
      case "post":
        const id = this.posts.length;
        let rootID = id;
        if (action.parentID != null && this.posts[action.parentID]) {
          rootID = this.posts[action.parentID].rootID;
        }
        this.posts.push({
          id,
          uid: user.uid,
          timeMs: timeMs,
          content: action.content,
          rootID,
        });
        break;

      case "like":
      default:
        console.log(`[FEED] ignoring action ${action.type}`);
    }
  }
}
