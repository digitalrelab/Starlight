import { SegmentedControl, SegmentedControlItem } from "@starlight/ui";
import { type LayoutId, layoutIds, layouts } from "./layouts/registry.ts";

interface Props {
  readonly value: LayoutId;
  readonly onChange: (layout: LayoutId) => void;
}

export const LayoutSwitcher = ({ value, onChange }: Props) => (
  <SegmentedControl value={value} onValueChange={onChange} aria-label="Layout">
    {layoutIds.map((id) => (
      <SegmentedControlItem key={id} value={id} icon={layouts[id].icon} label={layouts[id].label} />
    ))}
  </SegmentedControl>
);
