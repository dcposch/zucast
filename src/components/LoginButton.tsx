import { EXTERNAL_NULLIFIER } from "@/common/constants";
import { ZupassLoginButton } from "zukit";

export function LoginButton({ pubKeyHash }: { pubKeyHash: bigint }) {
  return (
    <ZupassLoginButton
      anonymous
      externalNullifier={EXTERNAL_NULLIFIER}
      signal={pubKeyHash}
      className="px-8 py-4 rounded-md font-semibold w-64 bg-accent hover:bg-accent-dark-1 active:bg-accent-dark-2 disabled:bg-accent-dark-2 disabled:opacity-75 disabled:cursor-default"
    />
  );
}
