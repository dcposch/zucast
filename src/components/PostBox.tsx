import { Post } from "@/common/model";
import { UserIcon } from "./UserIcon";

export function PostBox({ post }: { post: Post }) {
  const time = formatTime(post.timeMs); // eg "6m"
  return (
    <div className="flex gap-8">
      <UserIcon user={post.user} />
      <div className="flex flex-col">
        <header>
          <strong>#{post.user.uid}</strong> · {time}
        </header>
        <div>{post.content}</div>
      </div>
    </div>
  );
}

function formatTime(timeMs: number) {
  const secsAgo = Math.floor((Date.now() - timeMs) / 1000);
  if (secsAgo < 60) return "just now";
  if (secsAgo < 60 * 60) return `${Math.floor(secsAgo / 60)}m`;
  if (secsAgo < 60 * 60 * 24) return `${Math.floor(secsAgo / 60 / 60)}h`;
  return `${Math.floor(secsAgo / 60 / 60 / 24)}d`;
}
