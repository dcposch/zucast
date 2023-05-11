import { HeartFillIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { NoteSummary } from "../common/model";
import { PostBox } from "./PostBox";
import { UserIcon } from "./UserIcon";
import { plural } from "src/client/string";

export function NoteBox({ summary }: { summary: NoteSummary }) {
  // Link to the post
  const router = useRouter();
  const { post } = summary;
  const goToPost = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).tagName === "A") return;
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      router.push(`/post/${post.id}`);
    },
    [post.id, router]
  );

  if (summary.replyPost) {
    return <PostBox post={summary.replyPost} noButtons yesLink />;
  }

  const users = summary.likeUsers.slice(0, 20);
  const iconSize = users.length > 5 ? "w-3" : "w-7";

  return (
    <>
      <div
        onClick={goToPost}
        className="flex gap-6 p-2 rounded-lg select-none cursor-pointer hover:bg-white-hov"
      >
        {/** Left: like icon */}
        <div className="w-8 h-8 rounded-md flex-none leading-none flex justify-center items-center select-none bg-red-bg">
          <HeartFillIcon fill="red" />
        </div>
        {/** Right: which users liked your post */}
        <div className={classNames("min-w-0 flex flex-col gap-1 pt-2")}>
          <div className="flex items-center">
            {users.map((u) => (
              <div className={iconSize} key={u.uid}>
                <UserIcon user={u} size="w-6 h-6 text-sm" />
              </div>
            ))}
          </div>
          <div>
            <strong>{plural(summary.likeUsers.length, "user")}</strong> liked
            your post
          </div>
          <div className="font-xs break-words text-gray">{post.content}</div>
        </div>
      </div>
    </>
  );
}
