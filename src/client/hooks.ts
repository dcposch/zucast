import { useCallback, useContext, useState } from "react";
import { trpc } from "./trpc";
import { Action, User } from "@/common/model";
import { SelfContext } from "./self";
import { sign } from "@/common/crypto";

/** Sign an action (cast, like, etc), append to the global log. */
export function useSendAction() {
  const act = trpc.act.useMutation();
  const self = useContext(SelfContext);

  const send = useCallback(
    async (action: Action) => {
      if (!self) return;

      console.log(`[SEND] user ${self.user.uid} executing ${action.type}`);
      const { uid } = self.user;
      const { pair, pubKeyHex } = self.signingKey;
      const actionJSON = JSON.stringify(action);
      const signature = await sign(pair.privateKey, actionJSON);
      act.mutate({ uid, pubKeyHex, actionJSON, signature });
    },
    [act, self]
  );

  return [send, act] as [typeof send, typeof act];
}
