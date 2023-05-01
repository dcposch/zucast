import { SelfContext } from "@/client/self";
import { useSigningKey } from "@/common/crypto";
import { Thread, User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { server, feed } from "@/server";
import { GetServerSideProps } from "next";
import { useZupass } from "zukit";

interface HomePageProps {
  user: User | null;
  threads: Thread[];
}

export default function HomePage({ user, threads }: HomePageProps) {
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
        <FeedScreen feed={{ type: "home" }} threads={threads} />
      </SelfContext.Provider>
    );
  }
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (
  context
) => {
  // Authenticate
  const user = server.authenticateRequest(context.req);

  // Load posts only if logged in
  const threads = user == null ? [] : feed.loadGlobalFeed(user.uid);

  return { props: { user, threads } };
};
