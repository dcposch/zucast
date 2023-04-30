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

  nDirectReplies: number;
  nLikes: number;
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
  type: z.literal("like"),
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

export type StoredAction = StoredActionAct | StoredActionAddKey;

export type StoredActionAct = {
  timeMs: number;
  type: "act";
  uid: number;
  signature: string;
  pubKeyHex: string;
  actionJSON: string;
};

export type StoredActionAddKey = {
  timeMs: number;
  type: "addKey";
  pcd: string;
  pubKeyHex: string;
};
