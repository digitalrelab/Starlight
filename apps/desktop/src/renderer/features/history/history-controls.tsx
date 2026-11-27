import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useRouter } from "@tanstack/react-router";
import { useHistoryAvailability } from "./availability.ts";

export const HistoryControls = () => {
  const { back, forward } = useHistoryAvailability();
  const { history } = useRouter();
  return (
    <div className="flex shrink-0 items-center">
      <IconButton
        label="Back"
        icon={ArrowLeft01Icon}
        shortcut={["Meta", "["]}
        disabled={!back}
        onClick={() => history.back()}
      />
      <IconButton
        label="Forward"
        icon={ArrowRight01Icon}
        shortcut={["Meta", "]"]}
        disabled={!forward}
        onClick={() => history.forward()}
      />
    </div>
  );
};
