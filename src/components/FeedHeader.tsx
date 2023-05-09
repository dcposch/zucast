import {
  BellFillIcon,
  BellIcon,
  PersonFillIcon,
  PersonIcon,
} from "@primer/octicons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useNotes, useSelf } from "src/client/self";
import { LOGO_160, THEME_COLORS } from "src/common/constants";
import { Button, ButtonSmall, LinkSquare } from "./Button";
import { FeedType } from "./FeedScreen";
import { H2 } from "./typography";

export function FeedHeader({
  feed,
  showCompose,
}: {
  feed: FeedType;
  showCompose: () => void;
}) {
  const self = useSelf();
  if (!self) throw new Error("unreachable");

  // Navigation
  const { uid } = self.user;
  const isViewingHome = feed.type === "home";
  const isViewingSelf = feed.type === "profile" && feed.profileUser.uid === uid;
  const isViewingNotes = feed.type === "notes";
  const router = useRouter();
  const goToSelf = useCallback(
    () => router.push(`/user/${uid}`),
    [router, uid]
  );
  const goToNotes = useCallback(
    () => router.push(`/notes/${uid}`),
    [router, uid]
  );

  // Notifications
  const notes = useNotes();
  useEffect(() => {
    if (!isViewingNotes) return;
    const lastReadID = notes.notifications
      .map((n) => n.txID)
      .reduce((a, b) => Math.max(a, b), 0);
    notes.markRead(lastReadID);
  }, [isViewingNotes, notes]);

  // Center logo
  const logo = (
    <Image priority src={LOGO_160} width={40} height={40} alt="Logo" />
  );

  return (
    <header className="flex justify-between items-center py-3 bg-midnight sticky top-0">
      <H2>
        <div className="w-[10rem] flex items-center gap-2">
          {feed.type !== "home" && <LinkSquare href="/">&laquo;</LinkSquare>}
          {feed.type === "home" && "Home"}
          {feed.type === "thread" && "Thread"}
          {feed.type === "profile" && `#${feed.profileUser.uid}`}
        </div>
      </H2>
      {isViewingHome && <div className="opacity-80">{logo}</div>}
      {!isViewingHome && (
        <Link href="/" className="hover:opacity-80 active:opacity-70">
          {logo}
        </Link>
      )}
      <div className="w-[10rem] flex justify-end items-center gap-1">
        <ButtonSmall
          onClick={goToNotes}
          disabled={isViewingNotes}
          size="relative w-12 h-8"
        >
          {!isViewingNotes && <NoteBadge count={notes.numUnread} />}
          {isViewingNotes && <BellFillIcon fill={THEME_COLORS["primary"]} />}
          {!isViewingNotes && <BellIcon />}
        </ButtonSmall>
        <ButtonSmall
          onClick={goToSelf}
          disabled={isViewingSelf}
          size="relative w-12 h-8"
        >
          {isViewingSelf && <PersonFillIcon fill={THEME_COLORS["primary"]} />}
          {!isViewingSelf && <PersonIcon />}
        </ButtonSmall>
        <Button onClick={showCompose}>Post</Button>
      </div>
    </header>
  );
}

function NoteBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="absolute top-0 flex justify-center items-center w-min min-w-[1.5rem] h-5 rounded-full bg-red text-white text-xs">
      {count}
    </div>
  );
}
