import { trpc } from "@/client/trpc";
import { COOKIE_ZUCAST_TOKEN } from "@/common/constants";
import { KeyPair } from "@/common/crypto";
import Image from "next/image";
import { useEffect } from "react";
import { useZupass } from "zukit";
import { LoginButton } from "./LoginButton";
import { Container } from "./Container";
import Head from "next/head";
import { H1 } from "./typography";
import { useRouter } from "next/router";

export function LoginScreen({ signingKey }: { signingKey: KeyPair }) {
  const [zupass] = useZupass();
  const login = trpc.login.useMutation();

  // Delete stale cookies, if any
  useEffect(() => {
    document.cookie = `${COOKIE_ZUCAST_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }, []);

  // Once we have a proof from the Zuzalu Passport, upload our signing key
  useEffect(() => {
    if (zupass.status !== "logged-in") return;
    console.log(`[LOGIN] uploading signing key`);
    const { pubKeyHex } = signingKey;
    login.mutate({ pcd: JSON.stringify(zupass.serializedPCD), pubKeyHex });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zupass.status]);

  // Once that succeeds, set the zucastToken cookie, giving us read access
  const router = useRouter();
  useEffect(() => {
    if (login.isSuccess) {
      const token = login.data;
      console.log(`[LOGIN] setting cookie ${token}`);
      document.cookie = `${COOKIE_ZUCAST_TOKEN}=${token}; path=/`;

      // Load the feed
      router.replace(router.asPath);
    }
  }, [login, router]);

  return (
    <>
      <Head>
        <title>Zucast Login</title>
      </Head>
      <Container>
        <div className="leading-normal flex flex-col gap-4 text-center items-center">
          <div className="h-8" />
          <div className="-my-3">
            <Image
              priority
              src="/logo-160.png"
              width={80}
              height={80}
              alt="Logo"
            />
          </div>
          <H1>Zucast</H1>
          <p>
            A zero-knowledge forum,
            <br />
            private to Zuzalu.
          </p>
          {zupass.status !== "logged-in" && (
            <LoginButton pubKeyHash={signingKey.pubKeyHash} />
          )}
          <div />
          {zupass.status === "logged-in" && zupass.anonymous && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <div>✅ Valid zero-knowledge proof</div>
                <div>
                  👁️‍🗨️ Anonymity set <strong>{zupass.group.name}</strong>
                </div>
                <div>
                  🕶️ You are one of {zupass.group.members.length} members
                </div>
                <div>🔑 Creating signing key...</div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
