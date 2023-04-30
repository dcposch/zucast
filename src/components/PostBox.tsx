import { Post } from "@/common/model";
import { CommentIcon, HeartIcon } from "@primer/octicons-react";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Modal } from "./Modal";
import { UserIcon } from "./UserIcon";

export function PostBox({
  post,
  big,
  noButtons,
  connUp,
  connDown,
}: {
  post: Post;
  big?: boolean;
  noButtons?: boolean;
  connUp?: boolean;
  connDown?: boolean;
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
        className={classNames("flex gap-6 pr-2 rounded-lg", {
          "pl-2": !big,
          "cursor-default": !shouldLink,
          "cursor-pointer": shouldLink,
          "hover:bg-white-hov": shouldLink,
        })}
      >
        <div className="flex flex-col">
          {!big && (
            <div
              className={classNames("h-2 w-4 border-gray", {
                "border-r": connUp,
              })}
            />
          )}
          <UserIcon user={post.user} big={big} />
          {connDown && (
            <div
              className={classNames("flex-grow border-gray border-r", {
                "w-6": big,
                "w-4": !big,
              })}
            />
          )}
        </div>
        <div className={classNames("flex flex-col gap-1", { "py-2": !big })}>
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
              {post.parentID != null && !noButtons && !connUp && (
                <>
                  {" · "}
                  <Link href={`/post/${post.parentID}`}>
                    replying to #{post.parentUID}
                  </Link>
                </>
              )}
            </span>
          </header>
          <div className={classNames({ "text-xl": big })}>{post.content}</div>
          {!noButtons && (
            <div className="h-4">
              <IconButton
                type="reply"
                val={post.nDirectReplies}
                onClick={showCompose}
              />
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
  const icon = type === "like" ? <HeartIcon /> : <CommentIcon />;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick();
    },
    [onClick]
  );

  return (
    <button
      onClick={handleClick}
      className="w-16 h-6 flex items-end gap-2 -ml-2 px-2 py-1 text-left rounded-md text-sm text-gray
           bg-transparent hover:bg-white-act hover:text-white
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
