import { z } from "zod";

export interface User {
  /** Anon user ID */
  uid: number;
  /** Semaphore nullifier hash */
  nullifierHash: string;
  /** Profile */
  profile: UserProfile;
}

export interface UserProfile {
  emoji: string;
  color: string;
}

export interface Post {
  /** User viewing this post. See `liked` */
  authUID: number;
  /** Post ID */
  id: number;
  /** User who posted this */
  user: User;
  /** Time, in Unix ms */
  timeMs: number;
  /** Post content */
  content: string;
  /** Root ID = ID of this post or highest ancestor */
  rootID: number;
  /** Parent ID, or undefined if this is not a reply */
  parentID?: number;
  /** User we're replying to, if applicable */
  parentUID?: number;
  /** Whether the logged-in user (authUID) liked this post */
  liked: boolean;
  /** Total # of direct replies */
  nDirectReplies: number;
  /** Total # of likes */
  nLikes: number;
}

export interface Notification {
  type: "like" | "reply";
  /** Transaction ID that triggered this */
  txID: number;
  /** Time, in Unix ms */
  timeMs: number;
  /** Post liked or replied to */
  post: Post;
  /** User who liked or replied */
  user: User;
}

export interface NoteSummary {
  post: Post;
  replyPost?: Post;
  likeUsers: User[];
}

export interface Thread {
  rootID: number;
  /** The root post, followed by all replies, in order posted. */
  posts: Post[];
}

export const postActionModel = z.object({
  type: z.literal("post"),
  parentID: z.number().optional(),
  content: z.string(),
});

export const likeActionModel = z.object({
  type: z.union([z.literal("like"), z.literal("unlike")]),
  postID: z.number(),
});

export const saveProfileActionModel = z.object({
  type: z.literal("saveProfile"),
  profile: z.object({
    emoji: z.string(),
    color: z.string(),
  }),
});

export const actionModel = z.union([
  postActionModel,
  likeActionModel,
  saveProfileActionModel,
]);

export type Action = z.infer<typeof actionModel>;

export type Transaction = TransactionAct | TransactionAddKey;

export type TransactionAct = {
  timeMs: number;
  type: "act";
  uid: number;
  signature: string;
  pubKeyHex: string;
  actionJSON: string;
};

export type TransactionAddKey = {
  timeMs: number;
  type: "addKey";
  pcd: string;
  pubKeyHex: string;
};
