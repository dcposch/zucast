import Head from "next/head";
import { THEME_COLORS } from "../common/constants";

export function HeadMeta({
  title,
  desc,
  time,
}: {
  title?: string;
  desc?: string;
  time?: number;
}) {
  title = title || "Zucast";
  desc = desc || "A zero-knowledge forum, private to Zuzalu";

  const date = time != null && new Date(time * 1000).toISOString();

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="theme-color" content={THEME_COLORS["midnight"]} />
      {date && <meta name="og:type" content="article" />}
      {date && <meta property="article:published_time" content={date} />}
      <meta name="og:image" content="https://zuca.st/logo-280-telegram.png" />
      <meta name="og:title" content={title} />
      <meta name="og:description" content={desc} />
      <link rel="icon" href="/logo-160.png" sizes="160x160" />
      <link rel="icon" href="/favicon.ico" sizes="48x48" />
      <link rel="apple-touch-icon" href="/logo-160.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </Head>
  );
}
