import { Post } from "@/common/model";
import { UserIcon } from "./UserIcon";
import Link from "next/link";

export function PostBox({ post, big }: { post: Post; big?: boolean }) {
  const time = formatTime(post.timeMs); // eg "just now" or "6m"
  return (
    <div className="flex gap-6">
      <UserIcon user={post.user} big={big} />
      <div className="flex flex-col gap-1">
        <header className={big ? "text-lg" : undefined}>
          <strong>
            <Link href={`/user/${post.user.uid}`}>#{post.user.uid}</Link>
          </strong>{" "}
          <span className="text-gray">
            · <Link href={`/post/${post.id}`}>{time}</Link>
          </span>
        </header>
        <div className={big ? "text-xl" : undefined}>{post.content}</div>
        <div></div>
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
