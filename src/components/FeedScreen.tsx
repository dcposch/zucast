import { useRouter } from "next/router";
import { useCallback } from "react";
import { useRestoreScroll } from "src/client/useRestoreScroll";
import { useEscape } from "../client/hooks";
import { NoteSummary, SortAlgo, Thread, User } from "../common/model";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Container } from "./Container";
import { FeedHeader } from "./FeedHeader";
import { Modal } from "./Modal";
import { NoteBox } from "./NoteBox";
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
    }
  | {
      type: "notes";
      noteSummaries: NoteSummary[];
    };

export function FeedScreen({
  feed,
  threads,
  sortAlgo,
}: {
  feed: FeedType;
  threads: Thread[];
  sortAlgo?: SortAlgo;
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

  // Restore scroll on nav
  useRestoreScroll();

  // On home screen, display chosen sort algo
  sortAlgo = sortAlgo || "hot";

  console.log(`[FEED] ${feed.type} rendering ${threads.length} threads`);

  return (
    <>
      {isOpen && (
        <Modal onClose={hideCompose} title="Compose">
          <ComposeScreen onSuccess={postSucceeded} />
        </Modal>
      )}
      <Container>
        <FeedHeader {...{ feed, showCompose, sortAlgo }} />
        <main className="flex flex-col pb-32">
          {feed.type === "profile" && (
            <UserDetails tab={feed.tab} user={feed.profileUser} />
          )}
          <div className="h-4" />
          {feed.type !== "notes" && threads.length === 0 && (
            <strong className="text-center py-2">no posts yet</strong>
          )}
          {threads.map((thread, i) => (
            <ThreadBox
              key={`thread-${thread.rootID}-${thread.posts[0].id}`}
              borderTop={i > 0}
              {...{ thread, selectedPostID }}
            />
          ))}
          {feed.type === "notes" && feed.noteSummaries.length === 0 && (
            <strong className="text-center py-2">no notifications yet</strong>
          )}
          {feed.type === "notes" &&
            feed.noteSummaries.map((n) => (
              <NoteBox key={`${n.post.id}-${n.replyPost?.id}`} summary={n} />
            ))}
        </main>
      </Container>
    </>
  );
}
