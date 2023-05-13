import Link, { LinkProps } from "next/link";
import { CSSProperties, ReactNode } from "react";

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

const roundedLight = `
rounded-md font-semibold
bg-transparent hover:bg-white-hov active:bg-white-act
disabled:bg-transparent disabled:opacity-75 disabled:cursor-default
`;

const roundedOption = `
rounded-md font-semibold
bg-transparent hover:bg-white-hov active:bg-white-act
border border-transparent 
disabled:bg-white-act disabled:border-gray disabled:cursor-default
`;

export function ButtonSmall(
  props: JSX.IntrinsicElements["button"] & { size?: string }
) {
  const size = props.size || `px-4 py-2 text-center`;
  return <button {...props} className={`${size} ${roundedLight}`} />;
}

export function ButtonOption(
  props: JSX.IntrinsicElements["button"] & { size?: string }
) {
  const size = props.size || `px-4 py-2 text-center`;
  return <button {...props} className={`${size} ${roundedOption}`} />;
}

export function ButtonSquare(props: JSX.IntrinsicElements["button"]) {
  return <ButtonSmall {...props} size="w-8 h-8 text-center" />;
}

export function LinkSmall(
  props: LinkProps & { children: ReactNode; style?: CSSProperties }
) {
  return (
    <Link {...props} className={`px-4 py-2 text-center ${roundedLight}`} />
  );
}

export function LinkSquare(props: LinkProps & { children: ReactNode }) {
  return (
    <Link
      {...props}
      className="w-8 h-8 rounded-md flex justify-center items-center font-semibold
           bg-transparent hover:no-underline hover:bg-white-hov active:bg-white-act
           disabled:bg-transparent disabled:opacity-75 disabled:cursor-default"
    />
  );
}
