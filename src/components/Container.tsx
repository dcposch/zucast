import { CSSProperties } from "styled-components";

/** A centered column, middle of the page on desktop, whole screen on mobile. */
export function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={style} className="mx-auto max-w-[32rem] px-2 overflow-hidden">
      {children}
    </div>
  );
}
