import { KeyPair } from "@/common/crypto";

export function FeedScreen(props: {
  loggedInUid: number;
  signingKey: KeyPair;
}) {
  return (
    <>
      <h1>Zucast</h1>
      <p>Welcome, {props.loggedInUid}</p>
      <p>Pubkey {props.signingKey.pubKeyHex}</p>
    </>
  );
}
