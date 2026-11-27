import { Tooltip } from "@starlight/ui";

const LABEL = "Unsaved changes";

export const UnsavedDot = () => (
  <Tooltip label={LABEL}>
    <span role="img" aria-label={LABEL} className="size-2 rounded-full bg-neutral-bold" />
  </Tooltip>
);
