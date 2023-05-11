export function plural(word: string, count: number) {
  return count === 1 ? word : word + "s";
}

export function truncate(text: string, length: number) {
  return text.length > length ? text.slice(0, length) + "…" : text;
}
