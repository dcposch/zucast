import {
  StoredAction,
  StoredActionAct,
  StoredActionAddKey,
} from "@/common/model";
import { ZucastFeed } from "@/server/feed";

describe("Feed", () => {
  it("validates after init", async () => {
    await newFeed([sampleAddKey()]);
    await newFeed([sampleAddKey(), samplePost()]);

    const badPCD = sampleAddKey();
    badPCD.pubKeyHex = "foo";
    await expect(newFeed([badPCD])).rejects.toThrow(
      "Wrong signal, ignoring addKey"
    );
  }, 20_000);

  it("validates on append", async () => {
    const empty = await newFeed([]);
    await expect(empty.append(samplePost())).rejects.toThrow(
      "Ignoring action, uid not found"
    );
    await empty.append(sampleAddKey());
  });
});

async function newFeed(log: StoredAction[]): Promise<ZucastFeed> {
  const feed = new ZucastFeed();
  await feed.init(log);
  await feed.validate();
  return feed;
}

function sampleAddKey(): StoredActionAddKey {
  return {
    pcd: '{"type":"semaphore-group-signal","pcd":"{\\"type\\":\\"semaphore-group-signal\\",\\"id\\":\\"2042b952-1e34-4977-8b89-e5092bdd05fe\\",\\"claim\\":{\\"merkleRoot\\":\\"11809297090928808463097287771132557972288841476757973860739152448990920609708\\",\\"depth\\":16,\\"externalNullifier\\":\\"420\\",\\"nullifierHash\\":\\"8941435910672510420697618269036565481324260141702727864298936337425298748986\\",\\"signal\\":\\"14548653408222800303858900355054671409106678829497654880071378725207626657\\"},\\"proof\\":[\\"826717737534256012341570302020782686866083789126649050333306353919980422581\\",\\"3675541684873156954011187967049143549963763356421363157017788506627466570842\\",\\"4313032861368704779875631178615229907391707058330362936978631004154658030473\\",\\"5835133709242793862661903147860717251021423819729469116320278834086052224638\\",\\"19379615364760906383710091680029474619079275042186969824434769007631240385974\\",\\"15247908374800881903868539904491819977981876402727695576390674329139580786774\\",\\"5742215948151086397249001774984240724474386467481955079341125228679416864670\\",\\"12242863582104525287847797376042768665022556475419514987246233104845280142300\\"]}"}',
    type: "addKey",
    timeMs: 1683070932807,
    pubKeyHex:
      "0429e47bbeae210cdf6c8ffadcacecbc5ed4e430d8f1caa5eb290bf34fe4d6aa88af3e092cb4176199423854d3eace3025f4e850d19d7c4601dd75c996ed174548",
  };
}

function samplePost(): StoredActionAct {
  return {
    uid: 0,
    type: "act",
    timeMs: 1683071066450,
    pubKeyHex:
      "0429e47bbeae210cdf6c8ffadcacecbc5ed4e430d8f1caa5eb290bf34fe4d6aa88af3e092cb4176199423854d3eace3025f4e850d19d7c4601dd75c996ed174548",
    signature:
      "04c2478bc4ec5f46593e783e323153a70530d469509755c5a28423f35bef5f1c077922a651f77afa65b1a9cc100151a6cc79ecf21dd2abdd16c132eb61649f2f",
    actionJSON: '{"type":"post","content":"testing 123"}',
  };
}
