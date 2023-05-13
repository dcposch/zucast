import { Post, SortAlgo, Thread, sortAlgoModel } from "./model";

/** Returns a a sort algo, or the default if input is missing or invalid. */
export function parseSortAlgo(algo?: string): SortAlgo {
  try {
    return sortAlgoModel.parse(algo);
  } catch (_) {
    return "hot";
  }
}

export type SortFunc = (t: Thread) => number;

/** Returns the function that scores threads for sorting. Highest = appears first. */
export function getSortFunc(algo: SortAlgo): SortFunc {
  switch (algo) {
    case "latest":
      return (t: Thread) => t.posts[0].timeMs;
    case "hot":
      return scoreHot;
    default:
      throw new Error("unimplemented");
  }
}

/** Reddit-style scoring function, adapted for collapsed threads. */
function scoreHot(t: Thread) {
  return scoreHotPost(t.posts[0]) + scoreHotPost(t.posts[t.posts.length - 1]);
}

function scoreHotPost(post: Post) {
  const logScore = Math.log10(Math.max(post.nLikes, 1));

  const t = 12 * 3600 * 1000; // 12 hours
  const ageInPeriods = post.timeMs / t;

  // An t-old post with 5 likes ranks equally to a 2t-old post with 50 likes.
  return logScore + ageInPeriods;
}

/** Boost own recent posts, so they appear on top (to ourselves). */
export function scoreSelfBoost(t: Thread, myUID: number, nowMs: number) {
  const boost = (p: Post) => {
    if (p.user.uid !== myUID) return 0;
    const ageInMinutes = (nowMs - p.timeMs) / 1000 / 60;
    return Math.max(0, 60 - ageInMinutes);
  };
  return boost(t.posts[0]) + boost(t.posts[t.posts.length - 1]);
}
