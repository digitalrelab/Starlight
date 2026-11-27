import type { SyntheticEvent } from "react";

export const reveal = ({ currentTarget }: SyntheticEvent<HTMLImageElement>) =>
  currentTarget.decode().then(
    () => {
      currentTarget.dataset["loaded"] = "";
    },
    () => undefined,
  );
