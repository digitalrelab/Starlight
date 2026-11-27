import type { ActiveTrigger } from "@starlight/markdown/editor";
import {
  highlightable,
  ItemHint,
  ItemLeading,
  listBody,
  listGroupLabel,
  listItem,
  listPopup,
  ScrollArea,
} from "@starlight/ui";
import { type ReactElement, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export interface TriggerOption {
  readonly key: string;
  readonly group: string;
  readonly leading: ReactElement;
  readonly label: string;
  readonly detail?: string | undefined;
}

export interface Resolution<Choice> {
  readonly choices: ReadonlyArray<Choice>;
  readonly settled: boolean;
}

const keepInView = (option: HTMLElement | null) => option?.scrollIntoView({ block: "nearest" });

const sameKeys = (a: ReadonlyArray<TriggerOption>, b: ReadonlyArray<TriggerOption>) =>
  a.length === b.length && a.every((option, index) => option.key === b[index]?.key);

export const TriggerMenu = <Choice extends TriggerOption>({
  active,
  resolution: { choices, settled },
}: {
  readonly active: ActiveTrigger<Choice>;
  readonly resolution: Resolution<Choice>;
}) => {
  const resolved = sameKeys(choices, active.choices);
  const unmatched = settled && choices.length === 0 && /\s/.test(active.query);
  useLayoutEffect(() => {
    if (unmatched) active.dismiss();
    else if (!resolved) active.resolve(choices);
  }, [unmatched, resolved, active, choices]);
  const host = active.host();
  if (host === undefined || choices.length === 0) return null;
  const groups = Map.groupBy(
    choices.map((choice, index) => ({ choice, index })),
    ({ choice }) => choice.group,
  );
  return createPortal(
    <div className={listPopup}>
      <ScrollArea className="max-h-80">
        <div role="listbox" className={listBody}>
          {[...groups].map(([group, options]) => (
            <div key={group} role="group" aria-label={group}>
              <div aria-hidden className={listGroupLabel}>
                {group}
              </div>
              {options.map(({ choice, index }) => {
                const highlighted = index === active.index;
                return (
                  <div
                    key={choice.key}
                    ref={highlighted ? keepInView : undefined}
                    role="option"
                    aria-selected={highlighted}
                    {...highlightable(highlighted, () => active.highlight(index))}
                    className={listItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => active.choose(choice)}
                  >
                    <ItemLeading>{choice.leading}</ItemLeading>
                    <span className="min-w-0 truncate">{choice.label}</span>
                    {choice.detail ? <ItemHint>{choice.detail}</ItemHint> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>,
    host,
  );
};
