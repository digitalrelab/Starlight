import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

interface Option<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

interface Props<Value extends string> {
  readonly value: Value;
  readonly options: ReadonlyArray<Option<Value>>;
  readonly onValueChange: (value: Value) => void;
}

export const SegmentedControl = <Value extends string>({ value, options, onValueChange }: Props<Value>) => (
  <ToggleGroup<Value>
    value={[value]}
    onValueChange={([next]) => {
      if (next !== undefined) onValueChange(next);
    }}
    className="inline-flex gap-0.5 rounded-md bg-neutral p-0.5"
  >
    {options.map((option) => (
      <Toggle<Value>
        key={option.value}
        value={option.value}
        className="h-control-sm rounded-sm px-2.5 text-sm text-subtle transition-colors focus-ring hover:text-default data-[pressed]:bg-surface-raised data-[pressed]:text-default data-[pressed]:shadow-xs"
      >
        {option.label}
      </Toggle>
    ))}
  </ToggleGroup>
);
