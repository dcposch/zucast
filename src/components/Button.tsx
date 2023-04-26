import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

export function Button(props: JSX.IntrinsicElements["button"]) {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded-md font-semibold
           bg-primary hover:bg-primary-dark-1 active:bg-primary-dark-2
           disabled:bg-primary-dark-2 disabled:opacity-75 disabled:cursor-default"
    />
  );
}

export function ButtonSmall(props: JSX.IntrinsicElements["button"]) {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded-md font-semibold text-center
           bg-transparent hover:bg-white-5% active:bg-white-10%
           disabled:bg-transparent disabled:opacity-75 disabled:cursor-default"
    />
  );
}

export function ButtonSquare(props: JSX.IntrinsicElements["button"]) {
  return (
    <button
      {...props}
      className="w-8 h-8 rounded-md font-semibold text-center
           bg-transparent hover:bg-white-5% active:bg-white-10%
           disabled:bg-transparent disabled:opacity-75 disabled:cursor-default"
    />
  );
}

export function LinkSquare(props: LinkProps & { children: ReactNode }) {
  return (
    <Link
      {...props}
      className="inline-block w-8 h-8 rounded-md font-semibold text-center
           bg-transparent hover:bg-white-5% active:bg-white-10%
           disabled:bg-transparent disabled:opacity-75 disabled:cursor-default"
    />
  );
}
