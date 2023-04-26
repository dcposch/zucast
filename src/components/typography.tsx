import { HTMLAttributes } from "react";

export function H1(props: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className="text-2xl font-bold" {...props} />;
}

export function H2(props: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className="text-xl font-bold" {...props} />;
}
