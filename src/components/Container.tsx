/** A centered column, middle of the page on desktop, whole screen on mobile. */
export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[32rem] px-2 overflow-hidden">{children}</div>
  );
}
