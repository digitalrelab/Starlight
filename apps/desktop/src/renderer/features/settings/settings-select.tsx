import { Button, cn, Select } from "@starlight/ui";
import type { ReactNode } from "react";

interface Props<Value extends string> {
  readonly id: string;
  readonly values: readonly Value[];
  readonly labels: Record<Value, string>;
  readonly swatch?: (value: Value) => ReactNode;
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
}

export const SettingsSelect = <Value extends string>({
  id,
  values,
  labels,
  swatch,
  value,
  onValueChange,
}: Props<Value>) => {
  const renderOption = (option: Value) => (
    <>
      {swatch?.(option)}
      {labels[option]}
    </>
  );

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger id={id} render={<Button intent="secondary" className={cn(swatch && "pl-1.5")} />}>
        {renderOption(value)}
      </Select.Trigger>
      <Select.Popup>
        {values.map((option) => (
          <Select.Item key={option} value={option}>
            {renderOption(option)}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
};
