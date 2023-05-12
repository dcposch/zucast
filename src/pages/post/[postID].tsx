import { GetServerSideProps, Redirect } from "next";
import { truncate } from "src/client/string";
import { HeadMeta } from "src/components/HeadMeta";
import { SelfProvider } from "../../client/self";
import { useSigningKey } from "../../common/crypto";
import { Thread, User } from "../../common/model";
import { FeedScreen } from "../../components/FeedScreen";
import { feed, server } from "../../server";

interface PostPageProps {
  user: User | null;
  postID: number;
  thread: Thread;
}

/** Shows a single post, with surrounding thread if applicable. */
export default function PostPage({ user, thread, postID }: PostPageProps) {
  const signingKey = useSigningKey();

  // Render nothing during redirect.
  if (thread == null) return null;
  const post = thread.posts.find((p) => p.id === postID);
  if (post == null) return null;

  // Make link previews look nice
  const author = `#${post.user.uid} on Zucast`;
  const title =
    user == null ? author : `${author} · ${truncate(post.content, 60)}`;

  return (
    <SelfProvider {...{ user: user || undefined, signingKey }}>
      <HeadMeta title={title} desc={post.content} time={post.timeMs / 1000} />
      <FeedScreen threads={[thread]} feed={{ type: "thread", postID }} />
    </SelfProvider>
  );
}

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (
  context
) => {
  // Validate inputs
  const postID = Number(context.query.postID);
  if (!Number.isInteger(postID)) throw new Error("Invalid postID");
  const share = context.query.share;

  // Authenticate
  const user = await server.authenticateRequest(context.req);
  const isValidShare =
    typeof share === "string" && server.authPostShareToken(share, postID);

  if (user == null && !isValidShare) {
    return { redirect: { destination: "/" } as Redirect };
  }
  const uid = user == null ? -1 : user.uid;

  // Load data
  const post = feed.loadPost(uid, postID);
  if (post == null) throw new Error("Post not found");
  const thread = feed.loadThread(uid, post.id);

  return { props: { user, thread, postID } };
};
