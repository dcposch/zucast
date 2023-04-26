import { z } from "zod";

export interface User {
  /** Anon user ID */
  uid: number;
  /** Semaphore nullifier hash */
  nullifierHash: string;
  /** Profile */
  profile: {
    emoji: string;
    color: string;
  };
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

export const actionModel = z.union([postActionModel, likeActionModel]);

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
