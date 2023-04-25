import { trpc } from "@/client/trpc";
import {
  KeyPair,
  exportKeypair,
  generateKeypair,
  generateSigningKey,
  importKeypair,
  tryImportKeypair,
} from "@/common/crypto";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { ZupassLoginButton, useZupass } from "zukit";
import { generateMessageHash } from "@pcd/semaphore-group-pcd";

export default function LoginPage() {
  const [zupass] = useZupass();
  const addKey = trpc.addKey.useMutation();

  // Generate an ECDSA (P256) signing keypair, plus BJJ hash of the public key
  const [signingKey, setSigningKey] = useState<KeyPair>();
  useEffect(() => {
    console.log(`[LOGIN] loading or creating signing key`);
    (async () => {
      let storedJson = localStorage["signingKey"];
      let keypair = await tryImportKeypair(storedJson);
      if (keypair == null) {
        keypair = await generateKeypair();
        localStorage["signingKey"] = await exportKeypair(keypair);
      }
      setSigningKey(keypair);
    })();
  }, [setSigningKey]);

  // Once we have a proof from the Zuzalu Passport, upload our signing key
  useEffect(() => {
    if (zupass.status !== "logged-in") return;
    addKey.mutate({ pcd: JSON.stringify(zupass.serializedPCD) });
  }, [addKey, zupass]);

  useEffect(() => {
    if (addKey.isSuccess) {
      const token = addKey.data;
      // Add token as the zucastToken cookie
      document.cookie = `zucastToken=${token}; path=/`;
      // Redirect to the homepage
      redirect("/");
    }
  }, [addKey]);

  if (!signingKey) return null;

  return (
    <div>
      <h1>Zucast</h1>
      <div>
        <ZupassLoginButton
          anonymous
          externalNullifier="42"
          signal={signingKey.pubKeyHash}
        />
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
