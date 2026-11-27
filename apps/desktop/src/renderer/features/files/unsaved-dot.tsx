import { Tooltip } from "@starlight/ui";

export const UnsavedDot = () => (
  <Tooltip label="Unsaved changes">
    <span role="status" aria-label="Unsaved changes" className="size-2 rounded-full bg-neutral-bold" />
  </Tooltip>
);
