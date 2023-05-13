import { createContext, useContext, useMemo, useState } from "react";
import { KeyPair } from "../common/crypto";
import { Notification, User } from "../common/model";
import { trpc } from "./trpc";

const UserContext = createContext<User | undefined>(undefined);
const SigningKeyContext = createContext<KeyPair | undefined>(undefined);

/** Returns the logged-in anonymous user. */
export function useUser(): User | undefined {
  return useContext(UserContext);
}

/** Returns our signing key, used to perform actions. */
export function useSigningKey(): KeyPair | undefined {
  return useContext(SigningKeyContext);
}

export interface Notes {
  notifications: Notification[];
  numUnread: number;
  markRead: (txID: number) => void;
  lastReadID: number;
}

const NotesContext = createContext<Notes>({
  notifications: [],
  numUnread: 0,
  markRead: () => {},
  lastReadID: 0,
});

/** Returns new notifications (newest first), plus mark-read handling. */
export function useNotes(): Notes {
  return useContext(NotesContext);
}

export function SelfProvider({
  children,
  user,
  signingKey,
}: {
  children: React.ReactNode;
  user?: User;
  signingKey?: KeyPair;
}) {
  const sinceTxID = useMemo(() => {
    if (typeof localStorage === "undefined") return 0; // SSR
    return Number(localStorage?.lastReadID || 0);
  }, []);
  const query = trpc.loadNotifications.useQuery({ sinceTxID });

  const [lastReadID, setLastReadID] = useState(sinceTxID);

  const notes: Notes = useMemo(
    () => ({
      notifications: query.data || [],
      numUnread: (query.data || []).filter((n) => n.txID > lastReadID).length,
      markRead: (txID: number) => {
        console.log(`[SELF] marking notifications up to ${txID}`);
        localStorage["lastReadID"] = txID;
        setLastReadID(txID);
      },
      lastReadID,
    }),
    [query.data, lastReadID]
  );

  return (
    <UserContext.Provider value={user}>
      <SigningKeyContext.Provider value={signingKey}>
        <NotesContext.Provider value={notes}>{children}</NotesContext.Provider>
      </SigningKeyContext.Provider>
    </UserContext.Provider>
  );
}
