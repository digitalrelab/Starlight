import { DEFAULT_IGNORE_PATTERNS, isIgnorePattern } from "@starlight/client";
import { Button, Item } from "@starlight/ui";
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
      <Item.Root>
        <Item.Content>
          <Item.Title htmlFor="ignore-patterns">Ignored names</Item.Title>
          <Item.Description>
            Files and folders with these names are left out of the index and search. One per line; * and ?
            match any characters.
          </Item.Description>
        </Item.Content>
        <Button
          intent="secondary"
          onClick={() => {
            setDraft(DEFAULT_IGNORE_PATTERNS.join("\n"));
            save(DEFAULT_IGNORE_PATTERNS);
          }}
        >
          Restore defaults
        </Button>
      </Item.Root>
      <Item.Panel className="flex flex-col gap-2">
        <textarea
          id="ignore-patterns"
          value={draft}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (invalid.length === 0) save(linesOf(draft));
          }}
          className="field-sizing-content min-h-32 w-full resize-none rounded-md bg-surface-sunken px-3 py-2.5 font-mono text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-selected"
        />
        {invalid.length > 0 ? (
          <p className="text-sm text-danger">Names can’t contain “/”: {invalid.join(", ")}</p>
        ) : null}
      </Item.Panel>
    </Item.List>
  );
};
