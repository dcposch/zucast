import { MAX_POST_LENGTH, PROFILE_COLORS } from "./constants";
import { UserProfile } from "./model";

export function validatePost(content: string): string {
  if (content.trim() !== content) throw new Error("Post not trimmed");
  if (content === "") throw new Error("Post cannot be empty");
  if (content.length > MAX_POST_LENGTH) throw new Error(`Post too long`);
  return content;
}

export function validateEmoji(emoji: string): string {
  const match = emoji.match(/\p{Extended_Pictographic}/u);
  if (!match) throw new Error("Invalid emoji");
  return match[0];
}

export function validateProfile({
  emoji,
  color,
}: {
  emoji: string;
  color: string;
}): UserProfile {
  if (emoji !== validateEmoji(emoji)) throw new Error("Invalid emoji");
  if (!PROFILE_COLORS.includes(color)) throw new Error("Invalid color");
  return { emoji, color };
}
