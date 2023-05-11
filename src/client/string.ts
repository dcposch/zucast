export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function truncate(text: string, length: number) {
  return text.length > length ? text.slice(0, length) + "…" : text;
}
