import { trpc } from "../client/trpc";
import { LinkSmall } from "./Button";
import { UserIcon } from "./UserIcon";

const noUnderline = { textDecoration: "none" };

export function PostLikersScreen({ postID }: { postID: number }) {
  const query = trpc.loadLikers.useQuery({ postID });

  return (
    <div>
      {query.isLoading && <div>Loading...</div>}
      {query.error && <div className="text-error">{query.error.message}</div>}
      {query.data && (
        <div className="flex flex-wrap gap-2">
          {query.data.map((user) => (
            <LinkSmall
              key={user.uid}
              href={`/user/${user.uid}`}
              style={noUnderline}
            >
              <div className="flex gap-2 items-center" style={noUnderline}>
                <UserIcon user={user} />
                <span>#{user.uid}</span>
              </div>
            </LinkSmall>
          ))}
        </div>
      )}
    </div>
  );
}
