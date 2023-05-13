import { Cookie } from "../common/constants";

/** Gets a cookie by name */
export function getCookie(key: Cookie): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${key}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift();
}

/** Sets or clears a cookie */
export function setCookie(key: Cookie, value: string | null) {
  const expiry =
    value == null
      ? `expires=Thu, 01 Jan 1970 00:00:01 GMT`
      : `expires=Fri, 31 Dec 9999 23:59:59 GMT`;
  document.cookie = `${key}=${value || ""}; path=/; ${expiry}`;
}
