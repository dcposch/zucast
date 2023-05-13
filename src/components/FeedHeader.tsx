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
import { useNotes, useUser } from "../client/self";
import { LOGO_160, THEME_COLORS } from "../common/constants";
import { SortAlgo } from "../common/model";
import { Button, ButtonSmall, LinkSquare } from "./Button";
import { FeedType } from "./FeedScreen";
import { SortAlgoButton } from "./SortAlgoButton";
import { H2 } from "./typography";

export function FeedHeader({
  feed,
  showCompose,
  sortAlgo,
}: {
  feed: FeedType;
  showCompose: () => void;
  sortAlgo: SortAlgo;
}) {
  const user = useUser();
  if (!user) throw new Error("unreachable");

  // Navigation
  const uid = user?.uid;
  const isViewingHome = feed.type === "home";
  const isViewingSelf = feed.type === "profile" && feed.profileUser.uid === uid;
  const isViewingNotes = feed.type === "notes";
  const router = useRouter();
  const goToSelf = useCallback(
    () => router.push(uid == null ? "/" : `/user/${uid}`),
    [router, uid]
  );
  const goToNotes = useCallback(
    () => router.push(uid == null ? "/" : `/notes/${uid}`),
    [router, uid]
  );

  // Notifications
  const notes = useNotes();
  useEffect(() => {
    if (!isViewingNotes) return;
    if (notes.notifications.length === 0) return;
    const lastReadID = notes.notifications
      .map((n) => n.txID)
      .reduce((a, b) => Math.max(a, b), 0);
    notes.markRead(lastReadID);
  }, [isViewingNotes, notes]);

  // Center logo
  const logo = <Image src={LOGO_160} width={40} height={40} alt="Logo" />;

  return (
    <header className="flex justify-between items-center py-3 bg-midnight">
      <H2>
        <div className="w-[10rem] flex items-center gap-2">
          {feed.type !== "home" && <LinkSquare href="/">&laquo;</LinkSquare>}
          {feed.type === "home" && "Home"}
          {feed.type === "home" && <SortAlgoButton {...{ sortAlgo }} />}
          {feed.type === "thread" && "Thread"}
          {feed.type === "notes" && "Notes"}
          {feed.type === "profile" && `#${feed.profileUser.uid}`}
        </div>
      </H2>
      {isViewingHome && <div className="opacity-80">{logo}</div>}
      {!isViewingHome && (
        <Link href="/" className="hover:opacity-80 active:opacity-70">
          {logo}
        </Link>
      )}
      <div className="w-[10rem] flex justify-end items-center">
        {isViewingNotes && (
          <div className="opacity-75 pt-0.5 h-8 flex items-center">
            <BellFillIcon fill={THEME_COLORS["primary"]} />
          </div>
        )}
        {!isViewingNotes && (
          <ButtonSmall
            onClick={goToNotes}
            size={`relative h-8 pl-4 ${isViewingSelf ? "pr-4" : "pr-2"}`}
          >
            <NoteBadge count={notes.numUnread} />
            <BellIcon />
          </ButtonSmall>
        )}
        {isViewingSelf && (
          <div className="opacity-75 pt-0.5 h-8 flex items-center">
            <PersonFillIcon fill={THEME_COLORS["primary"]} />
          </div>
        )}
        {!isViewingSelf && (
          <ButtonSmall
            onClick={goToSelf}
            size={`h-8 pr-4 ${isViewingNotes ? "pl-4" : "pl-2"}`}
          >
            <PersonIcon />
          </ButtonSmall>
        )}
        {isViewingSelf && <div className="w-5" />}
        {!isViewingSelf && <div className="w-1" />}
        <Button onClick={showCompose}>Post</Button>
      </div>
    </header>
  );
}

function NoteBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="absolute top-0 left-3 flex justify-center items-center w-min min-w-[1.5rem] h-5 rounded-full bg-red text-white text-xs">
      {count}
    </div>
  );
}
