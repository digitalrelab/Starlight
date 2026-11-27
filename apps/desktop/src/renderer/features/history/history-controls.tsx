import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useRouter } from "@tanstack/react-router";
import { HISTORY_STEPS, historyDirections } from "#shared/history.ts";
import { useHistoryAvailability } from "./availability.ts";

const ICONS = { back: ArrowLeft01Icon, forward: ArrowRight01Icon };

export const HistoryControls = () => {
  const availability = useHistoryAvailability();
  const { history } = useRouter();
  return (
    <>
      {historyDirections.map((direction) => {
        const { label, key, offset } = HISTORY_STEPS[direction];
        return (
          <IconButton
            key={direction}
            label={label}
            icon={ICONS[direction]}
            shortcut={["Meta", key]}
            disabled={!availability[direction]}
            onClick={() => history.go(offset)}
          />
        );
      })}
    </>
  );
};
