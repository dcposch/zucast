import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Post, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { authenticateRequest } from "@/server/auth";
import { FeedUser, feed } from "@/server/feed";
import { GetServerSideProps } from "next";

interface UserPageProps {
  user: User;
  feedUser: FeedUser;
}

export default function UserPage({ user, feedUser }: UserPageProps) {
  const signingKey = useSigningKey();
  if (user == null || signingKey == null) return null;
  return (
    <SelfContext.Provider value={{ user, signingKey }}>
      <FeedScreen posts={feedUser.posts} feed={{ type: "user", feedUser }} />
    </SelfContext.Provider>
  );
}

export const getServerSideProps: GetServerSideProps<UserPageProps> = async (
  context
) => {
  const user = authenticateRequest(context.req);
  if (user == null) throw new Error("Not authenticated");
  const uid = Number(context.query.uid);
  if (!Number.isInteger(uid)) throw new Error("Invalid uid");
  const feedUser = feed.users[uid];
  if (feedUser == null) throw new Error("User not found");

  return { props: { user, feedUser } };
};
