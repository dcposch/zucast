import { Post } from "@/common/model";
import { UserIcon } from "./UserIcon";
import Link from "next/link";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Modal } from "./Modal";
import { useRouter } from "next/router";
import { useCallback, MouseEvent } from "react";
import classNames from "classnames";

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

  const router = useRouter();
  const goToPost = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).tagName === "A") return;
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      router.push(`/post/${post.id}`);
    },
    [post.id, router]
  );
  const shouldLink = !big && !noButtons;

  return (
    <>
      {isOpen && (
        <Modal onClose={hideCompose} title="Reply">
          <ComposeScreen onSuccess={postSucceeded} replyTo={post} />
        </Modal>
      )}

      <div
        onClick={shouldLink ? goToPost : undefined}
        className={classNames("flex gap-6 py-2 pr-2", {
          "pl-2": !big,
          "cursor-default": !shouldLink,
          "cursor-pointer": shouldLink,
          "hover:bg-white-hov": shouldLink,
        })}
      >
        <UserIcon user={post.user} big={big} />
        <div className="flex flex-col gap-1">
          <header className={classNames({ "text-lg": big })}>
            <strong>
              {noButtons && <span>#{post.user.uid}</span>}
              {!noButtons && (
                <Link href={`/user/${post.user.uid}`}>#{post.user.uid}</Link>
              )}
            </strong>
            <span className="text-gray">
              {" · "}
              {noButtons && <span>{time}</span>}
              {!noButtons && <Link href={`/post/${post.id}`}>{time}</Link>}
              {post.parentID != null && !noButtons && (
                <>
                  {" "}
                  · <Link href={`/post/${post.parentID}`}>reply</Link>
                </>
              )}
            </span>
          </header>
          <div className={classNames({ "text-xl": big })}>{post.content}</div>
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
           bg-transparent hover:bg-white-hov active:bg-white-act
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
