import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Post, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { authenticateRequest } from "@/server/auth";
import { feed } from "@/server/feed";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { redirect } from "next/dist/server/api-utils";

interface PostPageProps {
  user: User;
  postID: number;
  posts: Post[];
}

/** Shows a single post, with surrounding thread if applicable. */
export default function PostPage({ user, posts, postID }: PostPageProps) {
  const signingKey = useSigningKey();
  if (user == null || signingKey == null) return null;
  return (
    <SelfContext.Provider value={{ user, signingKey }}>
      <FeedScreen posts={posts} feed={{ type: "thread", postID }} />
    </SelfContext.Provider>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Authenticate
  const user = authenticateRequest(context.req);
  if (user == null) return { redirect: { destination: "/" } };

  // Validate inputs
  const postID = Number(context.query.postID);
  if (!Number.isInteger(postID)) throw new Error("Invalid postID");
  const post = feed.loadPost(postID);
  if (post == null) throw new Error("Post not found");

  // Load data
  const posts = feed.loadThread(post.rootID);

  return { props: { user, posts, postID } };
}
