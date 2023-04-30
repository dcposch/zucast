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
