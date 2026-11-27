import type { ReactElement } from "react";
import type { ItemKind } from "#renderer/features/files/kind-icon.tsx";

export interface NamingSlot {
  readonly entry: string | null;
  readonly kind: ItemKind;
  readonly field: ReactElement;
}

export const draftOf = (naming: NamingSlot | null) => (naming?.entry === null ? naming : null);

export const fieldFor = (naming: NamingSlot | null, entry: string) =>
  naming?.entry === entry ? naming.field : undefined;
