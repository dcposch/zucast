import { CSSProperties, useEffect, useState } from "react";
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

  // Freeze scroll on modal popup
  const [offset, setOffset] = useState<CSSProperties>();
  useEffect(() => {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    setOffset({ marginTop: top });
  }, []);

  return (
    <div className="w-full h-full min-h-screen absolute left-0 top-0 bg-[rgba(0,0,0,0.5)] py-4 z-10 overflow-scroll">
      <Container>
        {offset != null && (
          <div
            className="rounded-xl min-h-[16rem] flex flex-col gap-6 p-4 bg-midnight"
            style={offset}
          >
            <header className="flex justify-between items-center">
              <H2>{title}</H2>
              <ButtonSquare onClick={onClose}>&times;</ButtonSquare>
            </header>
            {children}
          </div>
        )}
      </Container>
    </div>
  );
}
