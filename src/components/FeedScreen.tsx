import { useEscape } from "@/client/hooks";
import { Thread, User } from "@/common/model";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Button, LinkSquare } from "./Button";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Container } from "./Container";
import { Modal } from "./Modal";
import { ThreadBox } from "./ThreadBox";
import { UserDetails } from "./UserDetails";
import { H2 } from "./typography";

type FeedType =
  | { type: "home" }
  | {
      type: "thread";
      postID: number;
    }
  | {
      type: "profile";
      profileUser: User;
      tab: string;
    };

export function FeedScreen({
  feed,
  threads,
}: {
  feed: FeedType;
  threads: Thread[];
}) {
  // Compose modal
  const { isOpen, showCompose, hideCompose, postSucceeded } = useComposeModal();

  // For thread view, highlight selected post
  const selectedPostID = feed.type === "thread" ? feed.postID : null;

  // ESC to return to previous feed
  const router = useRouter();
  const goBack = useCallback(
    () => feed.type !== "home" && router.push("/"),
    [feed.type, router]
  );
  useEscape(goBack);

  // Edge cases
  const comingSoon = feed.type === "profile" && feed.tab === "likes";
  const noPostsYet = !comingSoon && threads.length === 0;

  console.log(`[FEED] ${feed.type} rendering ${threads.length} threads`);

  return (
    <>
      <Head>
        <title>Zucast</title>
      </Head>
      {isOpen && (
        <Modal onClose={hideCompose} title="Compose">
          <ComposeScreen onSuccess={postSucceeded} />
        </Modal>
      )}
      <Container>
        <header className="flex justify-between items-center py-3 bg-midnight sticky top-0">
          <H2>
            {feed.type !== "home" && <LinkSquare href="/">&laquo;</LinkSquare>}
            {feed.type !== "home" && <div className="inline-block w-2" />}
            {feed.type === "home" && "Home"}
            {feed.type === "thread" && "Thread"}
            {feed.type === "profile" && `#${feed.profileUser.uid}`}
          </H2>
          <Button onClick={showCompose}>Post</Button>
        </header>
        <main className="flex flex-col">
          {feed.type === "profile" && (
            <UserDetails tab={feed.tab} user={feed.profileUser} />
          )}
          <div className="h-4" />
          {comingSoon && (
            <strong className="text-center py-2">coming soon</strong>
          )}
          {noPostsYet && (
            <strong className="text-center py-2">no posts yet</strong>
          )}
          {threads.map((thread) => (
            <ThreadBox key={thread.rootID} {...{ thread, selectedPostID }} />
          ))}
        </main>
      </Container>
    </>
  );
}
