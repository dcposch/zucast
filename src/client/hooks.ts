import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { sign } from "../common/crypto";
import { Action } from "../common/model";
import { useSigningKey, useUser } from "./self";
import { trpc } from "./trpc";

/** Sign an action (cast, like, etc), append to the global log. */
export function useSendAction() {
  const act = trpc.act.useMutation();
  const user = useUser();
  const signingKey = useSigningKey();
  const router = useRouter();

  const send = useCallback(
    async (action: Action) => {
      if (user == null) {
        // Redirect to login screen
        router.push("/");
        return;
      }
      if (signingKey == null) throw new Error("unreachable");

      console.log(`[SEND] user ${user.uid} executing ${action.type}`);
      const { uid } = user;
      const { pair, pubKeyHex } = signingKey;
      const actionJSON = JSON.stringify(action);
      const signature = await sign(pair.privateKey, actionJSON);
      act.mutate({ uid, pubKeyHex, actionJSON, signature });
    },
    [act, router, signingKey, user]
  );

  return [send, act] as [typeof send, typeof act];
}

// When Esc-ing from a screen, only escape from the top (most recent) one.
if (typeof window !== "undefined") {
  window.addEventListener("keydown", onKeyDown, { capture: true });
}
const escHandlers: (() => void)[] = [];
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (escHandlers.length === 0) return;
  escHandlers[escHandlers.length - 1]();
}

/** Perform a callback on Escape */
export function useEscape(callback: () => void) {
  useEffect(() => {
    escHandlers.push(callback);
    return () => {
      escHandlers.pop();
    };
  }, [callback]);
}

/** Convenience hook for modal parent state */
export function useModal() {
  const [isOpen, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  return [isOpen, show, hide] as const;
}
