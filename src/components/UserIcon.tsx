import { User } from "@/common/model";
import { useMemo } from "react";

export function UserIcon({ user, big }: { user: User; big?: boolean }) {
  const { profile } = user;
  const style = useMemo(() => ({ background: profile.color }), [profile.color]);
  const size = big ? "w-10 h-10 text-2xl" : "w-6 h-6 text-xl";
  return (
    <div
      style={style}
      className={`rounded-md ${size} leading-none flex justify-center items-center`}
    >
      {profile.emoji}
    </div>
  );
}
