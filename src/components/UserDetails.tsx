import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { useSelf } from "../client/self";
import { User } from "../common/model";
import { ButtonSmall } from "./Button";
import { EditProfileScreen } from "./EditProfileScreen";
import { Modal } from "./Modal";
import { UserIcon } from "./UserIcon";
import { H1 } from "./typography";

/** Display a user profile an Posts, Replies, Likes tabs. */
export function UserDetails({ tab, user }: { tab: string; user: User }) {
  // Edit Profile modal
  const [isEditing, setEditing] = useState(false);
  const editProfile = useCallback(() => setEditing(true), []);
  const close = useCallback(() => setEditing(false), []);
  const router = useRouter();
  const editSucceeded = useCallback(() => {
    setEditing(false);
    router.replace(router.asPath);
  }, [router]);

  const self = useSelf();
  if (self == null) return null;

  return (
    <>
      {isEditing && (
        <Modal onClose={close} title="Edit Profile">
          <EditProfileScreen onSuccess={editSucceeded} />
        </Modal>
      )}
      <div className="border-b border-midnight-1">
        <div className="flex gap-6 py-4">
          <UserIcon user={user} big />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <H1>#{user.uid}</H1>
              {self.user?.uid === user.uid && (
                <ButtonSmall onClick={editProfile}>Edit</ButtonSmall>
              )}
            </div>
            <div>
              <Label text="Nullifier Hash" />
              <div className="text-gray font-mono break-all">
                {user.nullifierHash}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 h-8">
          <Tab title="Posts" selected={tab === "posts"} />
          <Tab title="Replies" selected={tab === "replies"} />
          <Tab title="Likes" selected={tab === "likes"} />
        </div>
      </div>
    </>
  );
}

function Label({ text }: { text: string }) {
  return <label className="text-gray text-sm">{text}</label>;
}

function Tab({ title, selected }: { title: string; selected?: boolean }) {
  const router = useRouter();

  const tab = title.toLowerCase();
  const href = {
    pathname: router.basePath + router.asPath.split("?")[0],
    query: tab === "posts" ? {} : { tab },
  };

  if (selected) {
    return (
      <div className="flex justify-center items-end font-semibold">
        <div className="select-none h-6 border-b-2 border-white">{title}</div>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="flex justify-center items-end font-semibold 
      hover:no-underline hover:bg-white-hov active:bg-white-act"
    >
      <div className="select-none h-6">{title}</div>
    </Link>
  );
}
