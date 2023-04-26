import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Post, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { authenticateRequest } from "@/server/auth";
import { feed } from "@/server/feed";
import { GetServerSidePropsContext } from "next";
import { useZupass } from "zukit";

interface HomePageProps {
  user: User | null;
  posts: Post[];
}

export default function HomePage({ user, posts }: HomePageProps) {
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
        <FeedScreen feed={{ type: "home" }} posts={posts} />
      </SelfContext.Provider>
    );
  }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Authenticate
  const user = authenticateRequest(context.req);

  // Load posts only if logged in
  const posts = user == null ? [] : feed.loadGlobalFeed();

  return { props: { user, posts } };
}
