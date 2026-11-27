import { createContext, type ReactNode, use } from "react";
import { createPortal } from "react-dom";

export const ShellAsideSlot = createContext<HTMLElement | null>(null);

export const ShellAside = ({ children }: { readonly children: ReactNode }) => {
  const slot = use(ShellAsideSlot);
  return slot ? createPortal(children, slot) : null;
};
