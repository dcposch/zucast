import { Post } from "@/common/model";
import { UserIcon } from "./UserIcon";
import Link from "next/link";
import { ButtonSmall } from "./Button";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Modal } from "./Modal";

export function PostBox({
  post,
  big,
  noButtons,
}: {
  post: Post;
  big?: boolean;
  noButtons?: boolean;
}) {
  const { isOpen, showCompose, hideCompose, postSucceeded } = useComposeModal();

  const time = formatTime(post.timeMs); // eg "just now" or "6m"
  return (
    <>
      {isOpen && (
        <Modal onClose={hideCompose} title="Reply">
          <ComposeScreen onSuccess={postSucceeded} replyTo={post} />
        </Modal>
      )}
      <div className={`flex gap-6 ${big ? "" : "pl-2"}`}>
        <UserIcon user={post.user} big={big} />
        <div className="flex flex-col gap-1">
          <header className={big ? "text-lg" : undefined}>
            <strong>
              <Link href={`/user/${post.user.uid}`}>#{post.user.uid}</Link>
            </strong>{" "}
            <span className="text-gray">
              · <Link href={`/post/${post.id}`}>{time}</Link>
              {post.parentID && (
                <>
                  {" "}
                  · <Link href={`/post/${post.parentID}`}>reply</Link>
                </>
              )}
            </span>
          </header>
          <div className={big ? "text-xl" : undefined}>{post.content}</div>
          {!noButtons && (
            <div>
              <IconButton type="reply" val={0} onClick={showCompose} />
            </div>
          )}
          <div></div>
        </div>
      </div>
    </>
  );
}

function IconButton({
  type,
  val,
  onClick,
}: {
  type: "like" | "reply";
  val: number;
  onClick: () => void;
}) {
  const icon = type === "like" ? "♡" : "🗨";
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-full text-center text-sm text-gray
           bg-transparent hover:bg-white-5% active:bg-white-10%
           disabled:bg-transparent disabled:opacity-75 disabled:cursor-default"
    >
      {icon} {val > 0 && val}
    </button>
  );
}

function formatTime(timeMs: number) {
  const secsAgo = Math.floor((Date.now() - timeMs) / 1000);
  if (secsAgo < 60) return "just now";
  if (secsAgo < 60 * 60) return `${Math.floor(secsAgo / 60)}m`;
  if (secsAgo < 60 * 60 * 24) return `${Math.floor(secsAgo / 60 / 60)}h`;
  return `${Math.floor(secsAgo / 60 / 60 / 24)}d`;
}
