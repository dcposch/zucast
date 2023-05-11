import Head from "next/head";

export function HeadMeta({ title, desc }: { title?: string; desc?: string }) {
  return (
    <Head>
      <title>{title || "Zucast"}</title>
      <meta
        name="description"
        content={desc || "A zero-knowledge forum, private to Zuzalu"}
      />
    </Head>
  );
}
