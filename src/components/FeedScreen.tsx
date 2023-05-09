import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { useEscape } from "../client/hooks";
import { Thread, User } from "../common/model";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Container } from "./Container";
import { FeedHeader } from "./FeedHeader";
import { Modal } from "./Modal";
import { ThreadBox } from "./ThreadBox";
import { UserDetails } from "./UserDetails";

export type FeedType =
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
        <FeedHeader feed={feed} showCompose={showCompose} />
        <main className="flex flex-col pb-16">
          {feed.type === "profile" && (
            <UserDetails tab={feed.tab} user={feed.profileUser} />
          )}
          <div className="h-4" />
          {threads.length === 0 && (
            <strong className="text-center py-2">no posts yet</strong>
          )}
          {threads.map((thread, i) => (
            <ThreadBox
              key={`thread-${thread.rootID}-${thread.posts[0].id}`}
              borderTop={i > 0}
              {...{ thread, selectedPostID }}
            />
          ))}
        </main>
      </Container>
    </>
  );
}
