import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Post, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { authenticateRequest } from "@/server/auth";
import { FeedUser, feed } from "@/server/feed";
import { GetServerSidePropsContext } from "next";

interface UserPageProps {
  user: User;
  profileUser: User;
  tab: string;
  posts: Post[];
}

/** Shows profile information for a single user, plus their latest posts. */
export default function UserPage({
  user,
  profileUser,
  tab,
  posts,
}: UserPageProps) {
  const signingKey = useSigningKey();

  if (user == null || signingKey == null) return null;
  return (
    <SelfContext.Provider value={{ user, signingKey }}>
      <FeedScreen posts={posts} feed={{ type: "profile", profileUser, tab }} />
    </SelfContext.Provider>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Authenticate
  const user = authenticateRequest(context.req);
  if (user == null) return { redirect: { destination: "/" } };

  // Validate inputs
  const uid = Number(context.query.uid);
  if (!Number.isInteger(uid)) throw new Error("Invalid uid");
  const profileUser = feed.loadUser(uid);
  if (profileUser == null) throw new Error("User not found");

  // Load posts
  const [tab, posts] = loadUserTab(uid, context.query.tab as string);

  return { props: { user, profileUser, tab, posts } };
}

function loadUserTab(uid: number, tab: string): [string, Post[]] {
  switch (tab) {
    case "likes":
      return ["likes", []];
    case "replies":
      return ["replies", feed.loadUserReplies(uid)];
    default:
      return ["posts", feed.loadUserPosts(uid)];
  }
}
