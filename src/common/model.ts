import { z } from "zod";

export interface User {
  /** Anon user ID */
  uid: number;
  /** Semaphore nullifier hash */
  nullifierHash: string;
  /** Public keys for signing actions */
  pubKeys: string[];
  /** Posts by this user */
  posts: Post[];
}

export interface Post {
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

export const postAction = z.object({
  type: z.literal("post"),
  parentID: z.number().optional(),
  content: z.string(),
});

export const likeAction = z.object({
  type: z.literal("like"),
  postID: z.number(),
});

export const action = z.union([postAction, likeAction]);

export type Action = z.infer<typeof action>;

export type StoredAction =
  | {
      timeMs: number;
      type: "act";
      uid: number;
      signature: string;
      action: Action;
    }
  | {
      timeMs: number;
      type: "addKey";
      pcd: string;
    };
