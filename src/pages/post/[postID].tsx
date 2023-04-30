import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Thread, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { authenticateRequest } from "@/server/auth";
import { feed } from "@/server/feed";
import { GetServerSideProps, Redirect } from "next";

interface PostPageProps {
  user: User;
  postID: number;
  thread: Thread;
}

/** Shows a single post, with surrounding thread if applicable. */
export default function PostPage({ user, thread, postID }: PostPageProps) {
  const signingKey = useSigningKey();
  if (user == null || signingKey == null) return null;

  return (
    <SelfContext.Provider value={{ user, signingKey }}>
      <FeedScreen threads={[thread]} feed={{ type: "thread", postID }} />
    </SelfContext.Provider>
  );
}

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (
  context
) => {
  // Authenticate
  const user = authenticateRequest(context.req);
  if (user == null) return { redirect: { destination: "/" } as Redirect };

  // Validate inputs
  const postID = Number(context.query.postID);
  if (!Number.isInteger(postID)) throw new Error("Invalid postID");
  const post = feed.loadPost(postID);
  if (post == null) throw new Error("Post not found");

  // Load data
  const thread = feed.loadThread(post.id);

  return { props: { user, thread, postID } };
};
