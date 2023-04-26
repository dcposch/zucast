import { User, UserProfile } from "@/common/model";
import { useMemo } from "react";

export function UserIcon({ user, big }: { user: User; big?: boolean }) {
  const { profile } = user;
  const size = big ? "w-10 h-10 text-2xl" : "w-8 h-8 text-xl";
  return <UserIconProfile profile={profile} size={size} />;
}

export function UserIconProfile({
  profile,
  size,
}: {
  profile: UserProfile;
  size: string;
}) {
  const style = useMemo(() => ({ background: profile.color }), [profile.color]);
  return (
    <div
      style={style}
      className={`rounded-md ${size} flex-none leading-none flex justify-center items-center select-none`}
    >
      {profile.emoji}
    </div>
  );
}
