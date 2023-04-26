export function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="w-full h-full min-h-screen absolute left-0 top-0 bg-[rgba(0,0,0,0.5)] p-4">
      <div className="rounded-xl min-h-[16rem] flex flex-col gap-8 p-8">
        <header className="flex justify-between">
          <h3 className="text-md font-bold">{title}</h3>
          <span className="close" onClick={onClose}>
            &times;
          </span>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
