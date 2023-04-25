import { usePassportPopupSetup } from "@pcd/passport-interface";

/** Requests proofs from the Passport, then returns the resulting PCD. */
export default function PassportPopup() {
  return <div>{usePassportPopupSetup()}</div>;
}
