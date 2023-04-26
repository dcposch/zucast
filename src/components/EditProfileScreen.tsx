import { useSendAction } from "@/client/hooks";
import { SelfContext } from "@/client/self";
import { useCallback, useContext, useEffect, useState } from "react";
import { Button, ButtonSmall } from "./Button";
import { UserIconProfile } from "./UserIcon";

const colors: string[] = [];
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 8; j++) {
    const hue = j === 7 ? 0 : j * 48;
    const sat = j === 7 ? 0 : 60 - i * 10;
    const light = 85 - i * 10;
    colors.push(`hsl(${hue}, ${sat}%, ${light}%)`);
  }
}

export function EditProfileScreen({ onSuccess }: { onSuccess: () => void }) {
  // In-progress profile edit
  const self = useContext(SelfContext);
  const [profile, setProfile] = useState(self?.user?.profile);

  const changeEmoji = useCallback(() => {
    if (!profile) return;
    const input = prompt("New emoji", profile.emoji);
    if (!input) return;
    const match = input.match(/\p{Extended_Pictographic}/u);
    if (!match) {
      alert("That's not an emoji");
      return;
    }
    setProfile({ ...profile, emoji: match[0] });
  }, [profile]);

  // Save button
  const [send, result] = useSendAction();
  const saveProfile = useCallback(() => {
    if (!profile) return;
    send({ type: "saveProfile", profile });
  }, [send, profile]);

  // Close on success
  useEffect(() => {
    if (result.isSuccess) onSuccess();
  }, [result.isSuccess, onSuccess]);

  if (!self) throw new Error("unreachable");
  if (!profile) throw new Error("unreachable");

  return (
    <div className="flex-grow flex flex-col gap-8 items-center">
      <div>
        <UserIconProfile size="w-12 h-12 text-3xl" profile={profile} />
      </div>
      <div className="grid grid-cols-8">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setProfile({ ...profile, color })}
            className="p-1"
          >
            <div style={{ background: color }} className="rounded-lg w-8 h-8" />
          </button>
        ))}
      </div>
      <div className="flex justify-between w-64">
        <ButtonSmall onClick={changeEmoji}>Change emoji</ButtonSmall>
        <Button onClick={saveProfile}>Save</Button>
      </div>
      <div>
        {result.error && (
          <div className="text-error">{result.error.message}</div>
        )}
      </div>
    </div>
  );
}
