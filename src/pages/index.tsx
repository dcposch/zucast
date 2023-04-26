import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { useSigningKey } from "@/common/crypto";
import { User } from "@/common/model";
import { FeedScreen } from "@/components/FeedScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { auth } from "@/server/auth";
import { feed } from "@/server/feed";
import { GetServerSideProps } from "next";
import { useZupass } from "zukit";

export default function HomePage({ user }: AuthProps) {
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
    return <FeedScreen user={user} signingKey={signingKey} />;
  }
}

interface AuthProps {
  user: User | null;
}

export const getServerSideProps: GetServerSideProps<AuthProps> = async (
  context
) => {
  const token = context.req.cookies[COOKIE_ZUCAST_TOKEN];
  const loggedInUid = auth.authenticate(token);
  const user = loggedInUid == null ? null : feed.users[loggedInUid];
  return { props: { user } };
};
