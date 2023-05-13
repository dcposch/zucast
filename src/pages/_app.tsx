import type { AppType } from "next/app";
import { ZupassProvider } from "zukit";
import { trpc } from "../client/trpc";
import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ZupassProvider>
      <Component {...pageProps} />
    </ZupassProvider>
  );
};

export default trpc.withTRPC(MyApp);
