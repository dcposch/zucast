import { KeyPair } from "@/common/crypto";
import { LoginButton } from "./LoginButton";

export function FeedScreen(props: {
  loggedInUid: number;
  signingKey: KeyPair;
}) {
  return (
    <>
      <h1>Zucast</h1>
      <LoginButton pubKeyHash={props.signingKey.pubKeyHash} />
      <p>Welcome, {props.loggedInUid}</p>
      <p>Pubkey {props.signingKey.pubKeyHex.substring(0, 10)}...</p>
    </>
  );
}
