import { KeyPair } from "@/common/crypto";
import { User } from "@/common/model";
import { createContext } from "react";

export interface Self {
  user: User;
  signingKey: KeyPair;
}

export const SelfContext = createContext<Self | undefined>(undefined);
