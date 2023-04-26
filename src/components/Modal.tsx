import { useEffect } from "react";
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
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn, { capture: true });
    return () => window.removeEventListener("keydown", fn, { capture: true });
  }, [onClose]);

  return (
    <div className="w-full h-full min-h-screen absolute left-0 top-0 bg-[rgba(0,0,0,0.5)] py-4">
      <Container>
        <div className="rounded-xl min-h-[16rem] flex flex-col gap-6 p-4 bg-primary-black">
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
