import type { WebContents } from "electron";

export type HistoryStep = -1 | 1;

export const stepHistory = ({ navigationHistory }: WebContents, offset: HistoryStep) => {
  if (navigationHistory.canGoToOffset(offset)) navigationHistory.goToOffset(offset);
};
