import { useSendAction } from "@/client/hooks";
import { Post } from "@/common/model";
import { CommentIcon, HeartFillIcon, HeartIcon } from "@primer/octicons-react";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent, useCallback, useEffect, useState } from "react";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Modal } from "./Modal";
import { UserIcon } from "./UserIcon";

export function useLikePost(post: Post) {
  const [act, result] = useSendAction();

  // Optimistic update
  const [[liked, nLikes], setLiked] = useState([post.liked, post.nLikes]);
  const toggleLike = useCallback(async () => {
    if (!liked) {
      setLiked([true, nLikes + 1]);
      await act({ type: "like", postID: post.id });
    } else {
      setLiked([false, nLikes - 1]);
      await act({ type: "unlike", postID: post.id });
    }
  }, [act, post, liked, nLikes]);

  useEffect(() => {
    if (result.error) {
      setLiked([post.liked, post.nLikes]);
      window.alert(result.error.message);
    }
  }, [post, result.error]);

  return [liked, nLikes, toggleLike] as const;
}

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
  // Compose a reply
  const { isOpen, showCompose, hideCompose, postSucceeded } = useComposeModal();

  // Link to the post
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

  // Like and unlike the post
  const [liked, nLikes, toggleLike] = useLikePost(post);

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
        {/** Left: user icon, reply lines */}
        <div className="flex flex-col">
          {!big && <Conn show={connUp} size={"h-2 w-4"} />}
          <UserIcon user={post.user} big={big} />
          {connDown && (
            <Conn show size={"flex-grow " + (big ? "w-6" : "w-4")} />
          )}
        </div>
        {/** Right: header, post content, reply+like buttons */}
        <div className={classNames("flex flex-col gap-1", { "pt-2": !big })}>
          <PostHeader {...{ post, time, big, connUp, noButtons }} />
          <div
            className={classNames("whitespace-pre-wrap", { "text-xl": big })}
          >
            {post.content}
          </div>
          {!noButtons && (
            <div className="flex gap-1">
              <IconButton
                type="reply"
                val={post.nDirectReplies}
                onClick={showCompose}
              />
              <IconButton
                type={liked ? "unlike" : "like"}
                val={nLikes}
                onClick={toggleLike}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PostHeader({
  post,
  time,
  big,
  noButtons,
  connUp,
}: {
  post: Post;
  time: string;
  big?: boolean;
  noButtons?: boolean;
  connUp?: boolean;
}) {
  return (
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
  );
}

/** Spacer, reply connector line */
function Conn({ show, size }: { show?: boolean; size: string }) {
  return (
    <div className={classNames(size, "border-gray", { "border-r": show })} />
  );
}

/** Reply, like, unlike button */
function IconButton({
  type,
  val,
  onClick,
}: {
  type: "like" | "unlike" | "reply";
  val: number;
  onClick: () => void;
}) {
  const icon = (function () {
    switch (type) {
      case "like":
        return <HeartIcon />;
      case "unlike":
        return <HeartFillIcon fill="red" />;
      case "reply":
        return <CommentIcon />;
    }
  })();

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
