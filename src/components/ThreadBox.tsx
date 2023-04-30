import { Post, Thread, User } from "@/common/model";
import { uniq } from "@/common/util";
import { useCallback, useState } from "react";
import { ButtonSmall } from "./Button";
import { PostBox } from "./PostBox";
import { UserIcon } from "./UserIcon";

export function ThreadBox({
  thread,
  selectedPostID,
}: {
  thread: Thread;
  selectedPostID: number | null;
}) {
  const [expanded, setExpanded] = useState(() => {
    if (thread.posts.length <= 3) return true;
    if (thread.posts.find((post) => post.id === selectedPostID)) return true;
    return false;
  });
  const expand = useCallback(() => setExpanded(true), []);
  const { posts } = thread;

  return (
    <>
      {expanded &&
        posts.map((post: Post, index: number) => {
          const connUp = index > 0 && post.parentID === posts[index - 1].id;
          const connDown =
            index < posts.length - 1 && post.id === posts[index + 1].parentID;
          const big = post.id === selectedPostID;
          return (
            <PostBox key={post.id} post={post} {...{ connUp, connDown, big }} />
          );
        })}
      {!expanded && (
        <>
          <PostBox post={posts[0]} connDown />
          <ExpandButton
            onClick={expand}
            numPosts={posts.length - 2}
            users={uniq(
              posts.slice(1, posts.length - 1).map((p) => p.user),
              (p) => p.uid
            )}
          />
          <PostBox post={posts[posts.length - 1]} connUp />
        </>
      )}
    </>
  );
}

function ExpandButton({
  onClick,
  numPosts,
  users,
}: {
  onClick: () => void;
  numPosts: number;
  users: User[];
}) {
  const iconSize = users.length > 5 ? "w-3" : "w-7";
  return (
    <div className="flex gap-2">
      <div className="w-6 grid grid-rows-3">
        <div className="border-r border-gray" />
        <div className="border-r border-gray border-dotted" />
        <div className="border-r border-gray" />
      </div>
      <ButtonSmall onClick={onClick}>
        <div className="flex items-center transition-all">
          <div className="text-sm font-normal w-24">...{numPosts} more by</div>
          {users.map((u) => (
            <div className={iconSize} key={u.uid}>
              <UserIcon user={u} size="w-6 h-6 text-sm" />
            </div>
          ))}
        </div>
      </ButtonSmall>
    </div>
  );
}
