import { KeyPair, tryImportKeypair } from "@/common/crypto";
import { auth } from "@/server/auth";
import { GetServerSideProps } from "next";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage({ loggedInUid }: AuthProps) {
  // Generate an ECDSA (P256) signing keypair, plus BJJ hash of the public key
  const [signingKey, setSigningKey] = useState<KeyPair>();
  useEffect(() => {
    console.log(`[HOME] loading signing key`);
    let storedJson = localStorage["signingKey"];
    tryImportKeypair(storedJson).then((k: KeyPair | undefined) => {
      if (k == null) {
        console.error(`[HOME] no signing key found`);
        redirect("/login");
      }
      setSigningKey(k);
    });
  }, [setSigningKey]);

  if (loggedInUid == null) {
    return redirect("/login");
  }

  if (signingKey == null) return null;

  return (
    <>
      <h1>Zucast</h1>
      <p>Welcome, {loggedInUid}</p>
      <p>Pubkey {signingKey.pubKeyHex}</p>
    </>
  );
}

interface AuthProps {
  loggedInUid?: number;
}

export const getServerSideProps: GetServerSideProps<AuthProps> = async (
  context
) => {
  const token = context.req.cookies["zucastToken"];
  const loggedInUid = auth.authenticate(token);
  return { props: { loggedInUid } };
};
