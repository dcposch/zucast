import { Post } from "@/common/model";
import Head from "next/head";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { ComposeScreen } from "./ComposeScreen";
import { Container } from "./Container";
import { Modal } from "./Modal";
import { PostBox } from "./PostBox";
import { H2 } from "./typography";
import { FeedUser } from "@/server/feed";

type FeedType =
  | {
      type: "thread";
      postID: number;
    }
  | {
      type: "user";
      feedUser: FeedUser;
    };

export function FeedScreen(props: { feed?: FeedType; posts: Post[] }) {
  const [modal, setModal] = useState<"cast">();
  const showCastModal = useCallback(() => setModal("cast"), []);
  const closeModal = useCallback(() => setModal(undefined), []);

  return (
    <>
      <Head>
        <title>Zucast</title>
      </Head>
      {modal === "cast" && (
        <Modal onClose={closeModal} title="Cast">
          <ComposeScreen onSuccess={closeModal} />
        </Modal>
      )}
      <Container>
        <header className="flex justify-between items-center my-2">
          <H2>Home</H2>
          <Button onClick={showCastModal}>Cast</Button>
        </header>
        <main className="flex flex-col gap-8">
          {props.posts.map((post) => (
            <PostBox key={post.id} post={post} />
          ))}
        </main>
      </Container>
    </>
  );
}
