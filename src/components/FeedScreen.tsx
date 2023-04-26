import { KeyPair } from "@/common/crypto";
import { LoginButton } from "./LoginButton";
import { User } from "@/common/model";
import { UserIcon } from "./UserIcon";

export function FeedScreen(props: { user: User; signingKey: KeyPair }) {
  return (
    <>
      <h1 className="text-xl">Zucast</h1>
      <LoginButton pubKeyHash={props.signingKey.pubKeyHash} />
      <p>Welcome, {props.user.uid}</p>
      <UserIcon user={props.user} />
      <p>Pubkey {props.signingKey.pubKeyHex.substring(0, 10)}...</p>
    </>
  );
}
