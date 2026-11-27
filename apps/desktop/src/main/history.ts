import type { WebContents } from "electron";

export const goBack = ({ navigationHistory }: WebContents) => {
  if (navigationHistory.canGoBack()) navigationHistory.goBack();
};

export const goForward = ({ navigationHistory }: WebContents) => {
  if (navigationHistory.canGoForward()) navigationHistory.goForward();
};
