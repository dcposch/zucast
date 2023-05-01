import { useEscape } from "@/client/hooks";
import { Thread, User } from "@/common/model";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useContext } from "react";
import { Button, ButtonSquare, LinkSquare } from "./Button";
import { ComposeScreen, useComposeModal } from "./ComposeScreen";
import { Container } from "./Container";
import { Modal } from "./Modal";
import { ThreadBox } from "./ThreadBox";
import { UserDetails } from "./UserDetails";
import { H2 } from "./typography";
import { PersonIcon } from "@primer/octicons-react";
import { SelfContext } from "@/client/self";

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
        <FeedHeader feed={feed} showCompose={showCompose} />
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
          {threads.map((thread, i) => (
            <ThreadBox
              key={thread.rootID}
              borderTop={i > 0}
              {...{ thread, selectedPostID }}
            />
          ))}
        </main>
      </Container>
    </>
  );
}

function FeedHeader({
  feed,
  showCompose,
}: {
  feed: FeedType;
  showCompose: () => void;
}) {
  const self = useContext(SelfContext);
  if (!self) throw new Error("unreachable");

  const { uid } = self.user;
  const isViewingSelf = feed.type === "profile" && feed.profileUser.uid === uid;
  const router = useRouter();
  const goToSelf = useCallback(
    () => router.push(`/user/${uid}`),
    [router, uid]
  );

  return (
    <header className="flex justify-between items-center py-3 bg-midnight sticky top-0">
      <H2>
        <div className="w-32 flex items-center gap-2">
          {feed.type !== "home" && <LinkSquare href="/">&laquo;</LinkSquare>}
          {feed.type === "home" && "Home"}
          {feed.type === "thread" && "Thread"}
          {feed.type === "profile" && `#${feed.profileUser.uid}`}
        </div>
      </H2>
      <Image priority src="/logo-160.png" width={40} height={40} alt="Logo" />
      <div className="w-32 flex justify-end items-center gap-2">
        <ButtonSquare onClick={goToSelf} disabled={isViewingSelf}>
          <PersonIcon />
        </ButtonSquare>
        <Button onClick={showCompose}>Post</Button>
      </div>
    </header>
  );
}
