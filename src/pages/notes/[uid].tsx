import { GetServerSideProps, Redirect } from "next";
import { HeadMeta } from "src/components/HeadMeta";
import { SelfProvider } from "../../client/self";
import { useSigningKey } from "../../common/crypto";
import { NoteSummary, User } from "../../common/model";
import { FeedScreen } from "../../components/FeedScreen";
import { feed, server } from "../../server";

interface NotesPageProps {
  user: User;
  noteSummaries: NoteSummary[];
}

/** Shows profile information for a single user, plus their latest posts. */
export default function NotesPage({ user, noteSummaries }: NotesPageProps) {
  const signingKey = useSigningKey();

  if (user == null) return null;
  return (
    <SelfProvider {...{ user, signingKey }}>
      <HeadMeta title="Notes · Zucast" />
      <FeedScreen threads={[]} feed={{ type: "notes", noteSummaries }} />
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
