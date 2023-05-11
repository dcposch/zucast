/** A centered column, middle of the page on desktop, whole screen on mobile. */
export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen overflow-y-scroll overscroll-y-none">
      <div className="mx-auto max-w-[32rem] px-2 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
