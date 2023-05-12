import classNames from "classnames";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useSelf } from "src/client/self";
import { useSendAction } from "../client/hooks";
import { MAX_POST_LENGTH } from "../common/constants";
import { Action, Post } from "../common/model";
import { Button } from "./Button";
import { PostBox } from "./PostBox";
import { UserIcon } from "./UserIcon";

export function useComposeModal() {
  const router = useRouter();
  const { user } = useSelf() || {};
  const goToLogin = useCallback(() => router.push("/"), [router]);

  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const showCompose = user ? open : goToLogin;
  const hideCompose = useCallback(() => setOpen(false), []);

  const postSucceeded = useCallback(() => {
    setOpen(false);
    router.replace(router.asPath);
  }, [router]);

  return { isOpen, showCompose, hideCompose, postSucceeded };
}

export function ComposeScreen({
  onSuccess,
  replyTo,
}: {
  onSuccess: () => void;
  replyTo?: Post;
}) {
  // Compose box
  const focus = useCallback((el: HTMLTextAreaElement) => el?.focus(), []);
  const [text, setText] = useState("");
  const changeText = useCallback(
    (e: ChangeEvent<{ value: string }>) => setText(e.target.value),
    []
  );

  // Length limit
  const maxChars = MAX_POST_LENGTH;
  const charsLeft = maxChars - text.length;

  // Send button
  const [send, result] = useSendAction();
  const sendPost = useCallback(() => {
    if (charsLeft < 0 || text.trim() === "") return;
    const action: Action = { type: "post", content: text.trim() };
    if (replyTo) action.parentID = replyTo.id;
    send(action);
  }, [charsLeft, text, replyTo, send]);
  const sendDisabled = charsLeft < 0 || text.trim() === "" || result.isLoading;

  // Close on success
  useEffect(() => {
    if (result.isSuccess) onSuccess();
  }, [result.isSuccess, onSuccess]);

  const self = useSelf();
  if (self?.user == null) throw new Error("unreachable");

  return (
    <div>
      {replyTo && <PostBox post={replyTo} noButtons connDown />}
      {replyTo && <div className="w-6 h-6 border-r border-gray" />}
      <div className="flex-grow flex gap-6 items-stretch">
        <div>
          <UserIcon big user={self.user} />
        </div>
        <div className="flex-grow flex flex-col">
          <textarea
            className="h-36 bg-transparent text-white border-none outline-none resize-none"
            placeholder="What's happening?"
            value={text}
            onChange={changeText}
            ref={focus}
          />
          <div className="flex justify-between items-baseline">
            <CharsLeft {...{ charsLeft, maxChars }} />
            <Button disabled={sendDisabled} onClick={sendPost}>
              Send
            </Button>
          </div>
          {result.error && (
            <div className="text-error">{result.error.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CharsLeft(props: { charsLeft: number; maxChars: number }) {
  const color = props.charsLeft < 0 ? "text-error" : "text-gray";
  return (
    <span className={classNames("tabular-nums", color)}>
      {props.charsLeft}/{props.maxChars}
    </span>
  );
}
