import { DEFAULT_IGNORE_PATTERNS, isIgnorePattern } from "@starlight/client";
import { Button, Collapsible, Item } from "@starlight/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";

const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

export const IgnorePatterns = () => {
  const { queries, mutations } = useStarlight();
  const { data: saved } = useSuspenseQuery(queries.ignorePatterns());
  const ignore = useMutation(mutations.ignore());
  const [draft, setDraft] = useState(() => saved.join("\n"));
  const invalid = linesOf(draft).filter((line) => !isIgnorePattern(line));

  const save = (patterns: ReadonlyArray<string>) => {
    if (patterns.join("\n") !== saved.join("\n")) ignore.mutate(patterns);
  };

  return (
    <Item.List>
      <Collapsible.Root>
        <Item.Root render={<Collapsible.Trigger />} className="group w-full cursor-interactive text-left">
          <Item.Content>
            <Item.Title>Ignored</Item.Title>
            <Item.Description>Left out of search</Item.Description>
          </Item.Content>
          <span className="flex items-center gap-2 text-sm text-subtle">
            {saved.length} names
            <Collapsible.Indicator />
          </span>
        </Item.Root>
        <Collapsible.Panel className="-mx-4">
          <textarea
            aria-label="Ignored names"
            value={draft}
            spellCheck={false}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (invalid.length === 0) save(linesOf(draft));
            }}
            className="block field-sizing-content w-full resize-none border-y border-default bg-surface-sunken px-4 py-3 font-mono text-sm leading-6 outline-none"
          />
          <div className="flex h-11 items-center justify-between gap-4 px-4 text-sm">
            {invalid.length > 0 ? (
              <span className="truncate text-danger">Names can’t contain “/”: {invalid.join(", ")}</span>
            ) : (
              <span className="text-subtle">One per line · * and ? match anything</span>
            )}
            <Button
              onClick={() => {
                setDraft(DEFAULT_IGNORE_PATTERNS.join("\n"));
                save(DEFAULT_IGNORE_PATTERNS);
              }}
            >
              Restore defaults
            </Button>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </Item.List>
  );
};
