export const onMainMessage = (type: string, handle: (event: MessageEvent) => void) => {
  const listener = (event: MessageEvent) => {
    if (event.source === window && event.data?.type === type) handle(event);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
};
