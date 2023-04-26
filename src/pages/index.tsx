import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { useSigningKey } from "@/common/crypto";
import { FeedScreen } from "@/components/FeedScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { auth } from "@/server/auth";
import { GetServerSideProps } from "next";
import { useZupass } from "zukit";

export default function HomePage({ loggedInUid }: AuthProps) {
  const signingKey = useSigningKey();
  const [zupass] = useZupass();

  if (signingKey == null) {
    // First, wait for the signing key to generate (nearly instant)
    return null;
  } else if (loggedInUid == null || zupass.status === "logged-out") {
    // Then, log in, associating the pubkey with our anonymous nullifierHash
    return <LoginScreen signingKey={signingKey} />;
  } else {
    // Finally, show the feed
    return <FeedScreen loggedInUid={loggedInUid} signingKey={signingKey} />;
  }
}

interface AuthProps {
  loggedInUid: number | null;
}

export const getServerSideProps: GetServerSideProps<AuthProps> = async (
  context
) => {
  const token = context.req.cookies[COOKIE_ZUCAST_TOKEN];
  let loggedInUid = auth.authenticate(token);
  return { props: { loggedInUid } };
};
