import classNames from "classnames";
import { useMemo } from "react";
import { User, UserProfile } from "../common/model";

export function UserIcon({
  user,
  big,
  size,
}: {
  user: User;
  big?: boolean;
  size?: string;
}) {
  const { uid, profile } = user;
  if (!size) {
    size = big ? "w-10 h-10 text-2xl" : "w-8 h-8 text-xl";
  }
  return <UserIconProfile profile={profile} size={size} title={`#${uid}`} />;
}

export function UserIconProfile({
  profile,
  size,
  title,
  onClick,
}: {
  profile: UserProfile;
  size: string;
  title?: string;
  onClick?: () => void;
}) {
  const style = useMemo(() => ({ background: profile.color }), [profile.color]);
  return (
    <div
      title={title}
      style={style}
      onClick={onClick}
      className={classNames(
        size,
        `rounded-md flex-none leading-none flex justify-center items-center select-none`,
        {
          "cursor-pointer": onClick != null,
        }
      )}
    >
      {profile.emoji}
    </div>
  );
}
