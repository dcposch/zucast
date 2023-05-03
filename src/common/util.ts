/** Behaves like unix uniq */
export function uniq<T, I>(arr: T[], id: (t: T) => I): T[] {
  const seen = new Set<I>();
  return arr.filter((t) => {
    const i = id(t);
    if (seen.has(i)) return false;
    seen.add(i);
    return true;
  });
}

/** Returns elapsed time in seconds */
export async function time(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return (performance.now() - start) / 1000;
}
