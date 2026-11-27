import type { WebContents } from "electron";

export const stepHistory = ({ navigationHistory }: WebContents, offset: -1 | 1) => {
  if (navigationHistory.canGoToOffset(offset)) navigationHistory.goToOffset(offset);
};
