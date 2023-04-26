import { EXTERNAL_NULLIFIER } from "@/common/constants";
import { ZupassLoginButton } from "zukit";

export function LoginButton({ pubKeyHash }: { pubKeyHash: bigint }) {
  return (
    <ZupassLoginButton
      anonymous
      externalNullifier={EXTERNAL_NULLIFIER}
      signal={pubKeyHash}
      className="px-8 py-4 rounded-md bg-purple-300 hover:bg-purple-400 active:bg-purple-500 disabled:bg-purple-200"
    />
  );
}
