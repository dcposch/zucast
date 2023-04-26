import { User } from "@/common/model";
import { useMemo } from "react";

export function UserIcon({ user }: { user: User }) {
  const { profile } = user;
  const style = useMemo(() => ({ background: profile.color }), [profile.color]);
  return (
    <div
      style={style}
      className="rounded-md w-6 h-6 flex justify-center align-middle"
    >
      {profile.emoji}
    </div>
  );
}
