import { useSendAction } from "@/client/hooks";
import { SelfContext } from "@/client/self";
import { ChangeEvent, useCallback, useContext, useState } from "react";
import { Button } from "./Button";
import { UserIcon } from "./UserIcon";
import { useEffect } from "react";

export function ComposeScreen({ onSuccess }: { onSuccess: () => void }) {
  // Compose box
  const focus = useCallback((el: HTMLTextAreaElement) => el?.focus(), []);
  const [text, setText] = useState("");
  const changeText = useCallback(
    (e: ChangeEvent<{ value: string }>) => setText(e.target.value),
    []
  );

  // Length limit
  const maxChars = 280;
  const charsLeft = maxChars - text.length;

  // Send button
  const [send, result] = useSendAction();
  const sendPost = useCallback(() => {
    if (charsLeft < 0 || text.trim() === "") return;
    send({ type: "post", content: text.trim() });
  }, [send, charsLeft, text]);
  const sendDisabled = charsLeft < 0 || text.trim() === "" || result.isLoading;

  // Close on success
  useEffect(() => {
    if (result.isSuccess) onSuccess();
  }, [result.isSuccess, onSuccess]);

  const self = useContext(SelfContext);
  if (!self) throw new Error("unreachable");

  return (
    <div className="flex-grow flex gap-8 items-stretch">
      <div>
        <UserIcon big user={self.user} />
      </div>
      <div className="flex-grow flex flex-col">
        <textarea
          className="flex-grow bg-transparent text-white border-none outline-none resize-none"
          placeholder="What's happening?"
          value={text}
          onChange={changeText}
          ref={focus}
        />
        <div className="flex justify-between items-baseline">
          <span className={charsLeft < 0 ? "text-error" : "text-gray"}>
            {charsLeft}/{maxChars}
          </span>
          <Button disabled={sendDisabled} onClick={sendPost}>
            Send
          </Button>
        </div>
        {result.error && (
          <div className="text-error">{result.error.message}</div>
        )}
      </div>
    </div>
  );
}
