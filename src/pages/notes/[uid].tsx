import { GetServerSideProps, Redirect } from "next";
import { SelfProvider } from "../../client/self";
import { useSigningKey } from "../../common/crypto";
import { NoteSummary, Thread, User } from "../../common/model";
import { FeedScreen, FeedType } from "../../components/FeedScreen";
import { HeadMeta } from "../../components/HeadMeta";
import { feed, server } from "../../server";
import { ComponentProps, useMemo } from "react";

interface NotesPageProps {
  user: User;
  noteSummaries: NoteSummary[];
}

const empty: Thread[] = [];

/** Shows profile information for a single user, plus their latest posts. */
export default function NotesPage({ user, noteSummaries }: NotesPageProps) {
  const signingKey = useSigningKey();

  const feed = useMemo<FeedType>(
    () => ({ type: "notes", noteSummaries }),
    [noteSummaries]
  );

  if (user == null) return null;
  return (
    <SelfProvider {...{ user, signingKey }}>
      <HeadMeta title="Notes · Zucast" />
      <FeedScreen threads={empty} feed={feed} />
    </SelfProvider>
  );
}

export const getServerSideProps: GetServerSideProps<NotesPageProps> = async (
  context
) => {
  // Authenticate
  const user = await server.authenticateRequest(context.req);
  if (user == null) return { redirect: { destination: "/" } as Redirect };

  // Load posts
  const noteSummaries = feed.loadNoteSummaries(user.uid);

  return { props: { user, noteSummaries } };
};
