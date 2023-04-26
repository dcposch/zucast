import { MAX_POST_LENGTH } from "./constants";

export function validatePost(content: string): string {
  if (content.trim() !== content) throw new Error("Post not trimmed");
  if (content === "") throw new Error("Post cannot be empty");
  if (content.length > MAX_POST_LENGTH) throw new Error(`Post too long`);
  return content;
}
