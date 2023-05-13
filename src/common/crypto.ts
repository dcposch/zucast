import { generateMessageHash } from "@pcd/semaphore-group-pcd";
import { useEffect, useState } from "react";

/** An ECDSA (P256) signing keypair. Pubkey is public, privkey stays in localStorage. */
export interface KeyPair {
  /** WebCrypto keypair */
  pair: CryptoKeyPair;
  /** Raw public key, hex encoded */
  pubKeyHex: string;
  /** BabyJubJub-sized hash of the public key */
  pubKeyHash: bigint;
}

const p256 = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };

/** Load an ECDSA keypair from localStorage, or generate and save. */
export function useSigningKey() {
  const [signingKey, setSigningKey] = useState<KeyPair>();

  // Generate an ECDSA (P256) signing keypair, plus BJJ hash of the public key
  useEffect(() => {
    (async () => {
      // How do people still use Brave?
      if (window.localStorage == null) {
        window.alert("Local storage missing. Please use a normal browser.");
        return;
      }

      let storedJson = localStorage["signingKey"];
      let keypair = await tryImportKeypair(storedJson);
      if (keypair == null) {
        keypair = await generateKeypair();
        localStorage["signingKey"] = await exportKeypair(keypair);
      }
      setSigningKey(keypair);
    })();
  }, [setSigningKey]);

  return signingKey;
}

/** Generates an ECDSA signing keypair.  */
export async function generateKeypair(): Promise<KeyPair> {
  console.log(`[CRYPTO] generating signing key`);
  const key = await crypto.subtle.generateKey(p256, true, ["sign", "verify"]);
  return fromPair(key);
}

/** Exports an ECDSA signing keypair to JWK. */
export async function exportKeypair(keypair: KeyPair): Promise<string> {
  const { pair } = keypair;
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return JSON.stringify({ publicKey, privateKey });
}

/** Deserializes an ECDSA signing keypair, returning null if missing/invalid. */
export async function tryImportKeypair(
  jwk?: string
): Promise<KeyPair | undefined> {
  if (!jwk) return undefined;
  try {
    return importKeypair(jwk);
  } catch (e: any) {
    console.error(`[CRYPTO] failed to import signing key`, e);
    return undefined;
  }
}

async function importKeypair(jwk: string): Promise<KeyPair> {
  console.log(`[CRYPTO] importing signing key`);
  const { publicKey, privateKey } = JSON.parse(jwk);
  const { subtle } = crypto;
  const pair: CryptoKeyPair = {
    publicKey: await subtle.importKey("jwk", publicKey, p256, true, ["verify"]),
    privateKey: await subtle.importKey("jwk", privateKey, p256, true, ["sign"]),
  };
  return fromPair(pair);
}

async function fromPair(pair: CryptoKeyPair): Promise<KeyPair> {
  const rawPubKey = await crypto.subtle.exportKey("raw", pair.publicKey);
  const pubKeyHex = Buffer.from(rawPubKey).toString("hex");
  const pubKeyHash = generateMessageHash(pubKeyHex);
  return { pair, pubKeyHex, pubKeyHash };
}

/** Deserializes an ECDSA public key. */
export async function importPubKey(hex: string): Promise<CryptoKey> {
  const buf = Buffer.from(hex, "hex");
  return crypto.subtle.importKey("raw", buf, p256, true, ["verify"]);
}

/** Returns a hex-encoded ECDSA P256 signature. */
export async function sign(privateKey: CryptoKey, message: string) {
  const msg = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign(p256, privateKey, msg);
  return Buffer.from(signature).toString("hex");
}

/** Verifies a ECDSA P256 signature. */
export async function verifySignature(
  pubKeyHex: string,
  signatureHex: string,
  message: string
) {
  const valid = await crypto.subtle.verify(
    p256,
    await importPubKey(pubKeyHex),
    Buffer.from(signatureHex, "hex"),
    new TextEncoder().encode(message)
  );
  if (!valid) {
    throw new Error(`Invalid signature`);
  }
}

const merkleRoots: Map<string, Promise<boolean>> = new Map();

/** Verifies a group */
export async function isValidZuzaluMerkleRoot(root: string) {
  let promise = merkleRoots.get(root);
  if (promise == null) {
    promise = fetchIsValidRoot(root);
    merkleRoots.set(root, promise);
  }
  const ret = await promise;

  console.log(`[CRYPTO] merkle root ${root} is ${ret ? "valid" : "invalid"}`);
  return ret;
}

export function testSetValid(root: string) {
  merkleRoots.set(root, Promise.resolve(true));
}

export async function preloadLatestRoot() {
  const url = "https://api.pcd-passport.com/semaphore/latest-root/1";
  console.log(`[CRYPTO] fetching latest merkle root ${url}`);

  const res = await fetch(url);
  if (res.status !== 200) throw new Error(`Error ${res.status} fetching root`);
  const root = await res.json();
  merkleRoots.set(root, Promise.resolve(true));
}

async function fetchIsValidRoot(root: string) {
  const url = `https://api.pcd-passport.com/semaphore/historic/1/${root}`;
  console.log(`[CRYPTO] fetching merkle root ${url}`);

  const res = await fetch(url);
  if (res.status === 200) return true;
  else if (res.status === 404) return false;
  throw new Error(`Server error ${res.status} fetching merkle root ${root}`);
}

export async function calcPostShareToken({
  id,
  parentID,
  uid,
  timeMs,
  content,
}: {
  id: number;
  parentID?: number;
  uid: number;
  timeMs: number;
  content: string;
}) {
  const preimage = JSON.stringify([id, parentID || 0, uid, timeMs, content]);
  const preimageBytes = new TextEncoder().encode(preimage);
  const hashBytes = await crypto.subtle.digest("SHA-256", preimageBytes);
  return Buffer.from(hashBytes).toString("hex").substring(0, 12);
}
