import { useSendAction } from "../client/hooks";
import { SelfContext } from "../client/self";
import { PROFILE_COLORS } from "../common/constants";
import { validateEmoji } from "../common/validation";
import { useCallback, useContext, useEffect, useState } from "react";
import { Button, ButtonSmall } from "./Button";
import { UserIconProfile } from "./UserIcon";
import { logoutAndReload } from "./LoginScreen";

export function EditProfileScreen({ onSuccess }: { onSuccess: () => void }) {
  // In-progress profile edit
  const self = useContext(SelfContext);
  const [profile, setProfile] = useState(self?.user?.profile);

  const changeEmoji = useCallback(() => {
    if (!profile) return;
    const input = prompt("New emoji", profile.emoji);
    if (!input) return;
    let emoji;
    try {
      emoji = validateEmoji(input);
    } catch (e) {
      alert("That's not an emoji");
      return;
    }
    setProfile({ ...profile, emoji });
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
        <UserIconProfile
          size="w-12 h-12 text-3xl"
          profile={profile}
          onClick={changeEmoji}
        />
      </div>
      <div className="grid grid-cols-8">
        {PROFILE_COLORS.map((color) => (
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
      <div className="flex justify-center">
        <ButtonSmall onClick={logoutAndReload}>Log out</ButtonSmall>
      </div>
      <div>
        {result.error && (
          <div className="text-error">{result.error.message}</div>
        )}
      </div>
    </div>
  );
}
