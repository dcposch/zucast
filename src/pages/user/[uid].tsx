import { GetServerSideProps, Redirect } from "next";
import { SelfProvider } from "../../client/self";
import { useSigningKey } from "../../common/crypto";
import { Thread, User } from "../../common/model";
import { FeedScreen } from "../../components/FeedScreen";
import { feed, server } from "../../server";
import Head from "next/head";
import { HeadMeta } from "src/components/HeadMeta";

interface UserPageProps {
  user: User;
  profileUser: User;
  tab: string;
  threads: Thread[];
}

/** Shows profile information for a single user, plus their latest posts. */
export default function UserPage({
  user,
  profileUser,
  tab,
  threads,
}: UserPageProps) {
  const signingKey = useSigningKey();

  if (user == null) return null;
  return (
    <SelfProvider {...{ user, signingKey }}>
      <HeadMeta title={`#${user.uid} on Zucast`} />
      <FeedScreen
        threads={threads}
        feed={{ type: "profile", profileUser, tab }}
      />
    </SelfProvider>
  );
}

export const getServerSideProps: GetServerSideProps<UserPageProps> = async (
  context
) => {
  // Authenticate
  const user = await server.authenticateRequest(context.req);
  if (user == null) return { redirect: { destination: "/" } as Redirect };

  // Validate inputs
  const uid = Number(context.query.uid);
  if (!Number.isInteger(uid)) throw new Error("Invalid uid");
  const profileUser = feed.loadUser(uid);
  if (profileUser == null) throw new Error("User not found");

  // Load posts
  const [tab, threads] = loadUserTab(user.uid, uid, context.query.tab);

  return { props: { user, profileUser, tab, threads } };
};

function loadUserTab(
  authUID: number,
  uid: number,
  tab: string | string[] | undefined
): [string, Thread[]] {
  switch (tab) {
    case "likes":
      return ["likes", feed.loadUserLikes(authUID, uid)];
    case "replies":
      return ["replies", feed.loadUserReplies(authUID, uid)];
    default:
      return ["posts", feed.loadUserPosts(authUID, uid)];
  }
}
