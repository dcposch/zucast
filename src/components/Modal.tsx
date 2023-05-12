import { CSSProperties, createRef, useEffect, useState } from "react";
import { useEscape } from "../client/hooks";
import { ButtonSquare } from "./Button";
import { Container } from "./Container";
import { H2 } from "./typography";

export function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  // Close on escape
  useEscape(onClose);

  // Preserve scroll on modal popup
  const modalRef = createRef<HTMLDivElement>();
  const [offset, setOffset] = useState<CSSProperties>();
  useEffect(() => {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    setOffset({ marginTop: top });
  }, []);

  // No overscroll while modal is open
  useEffect(() => {
    document.documentElement.classList.add("no-overscroll");
    return () => document.documentElement.classList.remove("no-overscroll");
  });

  // Keep modal in view. Skip on the Broken One (Safari)
  useEffect(() => {
    if (!navigator.userAgent.includes("WebKit")) return;
    if (modalRef.current == null) return;
    const onScroll = () => (modalRef.current as any).scrollIntoViewIfNeeded();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [modalRef]);

  return (
    <div className="w-full h-full min-h-screen absolute left-0 top-0 bg-[rgba(0,0,0,0.5)] z-10 overflow-scroll">
      <Container>
        {offset != null && (
          <div className="py-4" ref={modalRef} style={offset}>
            <div className="rounded-xl min-h-[16rem] flex flex-col gap-6 p-4 bg-midnight">
              <header className="flex justify-between items-center">
                <H2>{title}</H2>
                <ButtonSquare onClick={onClose}>&times;</ButtonSquare>
              </header>
              {children}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
