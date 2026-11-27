import {
  CheckListIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  MinusSignIcon,
  QuoteDownIcon,
  SourceCodeIcon,
  Table01Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import {
  INSERTIONS,
  type Insertion,
  type InsertionName,
  insert,
  insertionMatches,
  type TriggerSource,
  type TriggerStore,
  useTrigger,
} from "@starlight/markdown/editor";
import { Icon } from "@starlight/ui";
import { useSyncExternalStore } from "react";
import { TriggerMenu, type TriggerOption } from "./trigger-menu.tsx";

type Presentation = Pick<TriggerOption, "group" | "leading">;

const PRESENTATIONS: Record<InsertionName, Presentation> = {
  "Heading 1": { group: "Headings", leading: <Icon icon={Heading01Icon} /> },
  "Heading 2": { group: "Headings", leading: <Icon icon={Heading02Icon} /> },
  "Heading 3": { group: "Headings", leading: <Icon icon={Heading03Icon} /> },
  "Bulleted list": { group: "Lists", leading: <Icon icon={LeftToRightListBulletIcon} /> },
  "Numbered list": { group: "Lists", leading: <Icon icon={LeftToRightListNumberIcon} /> },
  Checklist: { group: "Lists", leading: <Icon icon={CheckListIcon} /> },
  Quote: { group: "Blocks", leading: <Icon icon={QuoteDownIcon} /> },
  "Code block": { group: "Blocks", leading: <Icon icon={SourceCodeIcon} /> },
  Table: { group: "Blocks", leading: <Icon icon={Table01Icon} /> },
  Divider: { group: "Blocks", leading: <Icon icon={MinusSignIcon} /> },
  Link: { group: "Insert", leading: <Icon icon={Link01Icon} /> },
};

interface SlashChoice extends TriggerOption {
  readonly insertion: Insertion;
}

const CHOICES: ReadonlyArray<SlashChoice> = INSERTIONS.map((insertion) => ({
  ...PRESENTATIONS[insertion.name],
  key: insertion.name,
  label: insertion.name,
  detail: insertion.hint,
  insertion,
}));

const SOURCE: TriggerSource<SlashChoice> = {
  character: "/",
  apply: ({ insertion }, state, from, to) => insert(insertion, state, from, to),
};

const SlashMenu = ({ store }: { readonly store: TriggerStore<SlashChoice> }) => {
  const active = useSyncExternalStore(store.subscribe, store.get);
  return (
    active && (
      <TriggerMenu
        active={active}
        resolution={{
          choices: CHOICES.filter(({ insertion }) => insertionMatches(insertion, active.query)),
          settled: true,
        }}
      />
    )
  );
};

export const useSlashCommands = () => {
  const { extension, store } = useTrigger(SOURCE);
  return { extension, element: <SlashMenu store={store} /> };
};
