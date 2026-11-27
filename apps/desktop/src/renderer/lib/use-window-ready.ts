import { useEffect } from "react";
import { Channel } from "#shared/channels.ts";

export const useWindowReady = () =>
  useEffect(() => {
    window.postMessage({ type: Channel.ready }, "*");
  }, []);
