import { useEffect } from "react";
import { ButtonSquare } from "./Button";
import { Container } from "./Container";
import { H2 } from "./typography";
import { useEscape } from "@/client/hooks";

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

  return (
    <div className="w-full h-full min-h-screen absolute left-0 top-0 bg-[rgba(0,0,0,0.5)] py-4 z-10">
      <Container>
        <div className="rounded-xl min-h-[16rem] flex flex-col gap-6 p-4 bg-midnight">
          <header className="flex justify-between items-center">
            <H2>{title}</H2>
            <ButtonSquare onClick={onClose}>&times;</ButtonSquare>
          </header>
          {children}
        </div>
      </Container>
    </div>
  );
}
