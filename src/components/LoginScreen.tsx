import { trpc } from "@/client/trpc";
import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { KeyPair } from "@/common/crypto";
import { useEffect } from "react";
import { ZupassLoginButton, useZupass } from "zukit";
import { LoginButton } from "./LoginButton";

export function LoginScreen({ signingKey }: { signingKey: KeyPair }) {
  const [zupass] = useZupass();
  const addKey = trpc.addKey.useMutation();

  // Delete stale cookies, if any
  useEffect(() => {
    document.cookie = `${COOKIE_ZUCAST_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }, []);

  // Once we have a proof from the Zuzalu Passport, upload our signing key
  useEffect(() => {
    if (zupass.status !== "logged-in") return;
    console.log(`[LOGIN] uploading signing key`);
    const { pubKeyHex } = signingKey;
    addKey.mutate({ pcd: JSON.stringify(zupass.serializedPCD), pubKeyHex });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zupass.status]);

  // Once that succeeds, set the zucastToken cookie, giving us read access
  useEffect(() => {
    if (addKey.isSuccess) {
      const token = addKey.data;
      console.log(`[LOGIN] setting cookie ${token}`);
      document.cookie = `${COOKIE_ZUCAST_TOKEN}=${token}; path=/`;
      // Load the feed
      window.location.reload();
    }
  }, [addKey]);

  return (
    <div>
      <h1>Zucast</h1>
      <div>
        <LoginButton pubKeyHash={signingKey.pubKeyHash} />
      </div>
      {zupass.status === "logged-in" && zupass.anonymous && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div>✅ Valid zero-knowledge proof</div>
            <div>
              👁️‍🗨️ Anonymity set <strong>{zupass.group.name}</strong>
            </div>
            <div>🕶️ You are one of {zupass.group.members.length} members</div>
            <div>🔑 Registering signing key...</div>
          </div>
        </div>
      )}
    </div>
  );
}
