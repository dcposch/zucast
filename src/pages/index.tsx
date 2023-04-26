import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Post, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { authenticateRequest } from "@/server/auth";
import { feed } from "@/server/feed";
import { GetServerSideProps } from "next";
import { useZupass } from "zukit";

interface HomePageProps {
  user: User | null;
  feedPosts: Post[];
}

export default function HomePage({ user, feedPosts }: HomePageProps) {
  const signingKey = useSigningKey();
  const [zupass] = useZupass();

  if (signingKey == null) {
    // First, wait for the signing key to generate (nearly instant)
    return null;
  } else if (user == null || zupass.status === "logged-out") {
    // Then, log in, associating the pubkey with our anonymous nullifierHash
    return <LoginScreen signingKey={signingKey} />;
  } else {
    // Finally, show the feed
    return (
      <SelfContext.Provider value={{ user, signingKey }}>
        <FeedScreen posts={feedPosts} />
      </SelfContext.Provider>
    );
  }
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (
  context
) => {
  const user = authenticateRequest(context.req);
  const feedPosts = user == null ? [] : feed.genGlobalFeed();
  return { props: { user, feedPosts } };
};
