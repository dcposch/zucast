import { GetServerSideProps } from "next";
import { useEffect } from "react";
import { HeadMeta } from "src/components/HeadMeta";
import { useZupass } from "zukit";
import { SelfProvider } from "../client/self";
import { EXTERNAL_NULLIFIER } from "../common/constants";
import { useSigningKey } from "../common/crypto";
import { Thread, User } from "../common/model";
import { FeedScreen } from "../components/FeedScreen";
import { LoginScreen, logoutAndReload } from "../components/LoginScreen";
import { feed, server } from "../server";

interface HomePageProps {
  user: User | null;
  threads: Thread[];
}

export default function HomePage({ user, threads }: HomePageProps) {
  const signingKey = useSigningKey();
  const [zupass] = useZupass();

  useEffect(() => logoutIfInvalidPCD(zupass), [zupass]);

  if (user == null) {
    // Log in, associating the pubkey with our anonymous nullifierHash
    return <LoginScreen signingKey={signingKey} />;
  } else {
    // Finally, show the feed
    return (
      <SelfProvider {...{ user, signingKey }}>
        <HeadMeta />
        <FeedScreen feed={{ type: "home" }} threads={threads} />
      </SelfProvider>
    );
  }
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (
  context
) => {
  // Authenticate
  const user = await server.authenticateRequest(context.req);

  // Load posts only if logged in
  const threads = user == null ? [] : feed.loadGlobalFeed(user.uid);

  return { props: { user, threads } };
};

function logoutIfInvalidPCD(zupass: ReturnType<typeof useZupass>[0]) {
  if (
    zupass.status === "logged-in" &&
    zupass.anonymous &&
    zupass.pcd.claim.externalNullifier !== "" + EXTERNAL_NULLIFIER
  ) {
    console.log("[HOME] logging out, wrong external nullifier");
    logoutAndReload();
  }
}
