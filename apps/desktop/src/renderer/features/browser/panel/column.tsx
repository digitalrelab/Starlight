import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { type Entry, entryKey } from "@starlight/client";
import { Card, cn, Icon, ScrollArea } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, type MouseEvent, memo, type ReactElement, useLayoutEffect, useRef } from "react";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import {
  isPlain,
  itemIndexAt,
  modifiersOf,
  onListKey,
  verticalStep,
} from "#renderer/features/browser/layouts/events.ts";
import { draftOf, fieldFor, type NamingSlot } from "#renderer/features/browser/layouts/naming-slot.ts";
import { ListingMenu } from "#renderer/features/browser/listing-menu.tsx";
import {
  type Modifiers,
  type SelectionStore,
  selectionId,
  useIsSelected,
  useRevealFocus,
} from "#renderer/features/browser/selection.ts";
import { useColumnEntries } from "./entries.ts";
import type { Place } from "./place.ts";
import { useSettled } from "./use-settled.ts";

const ROW_HEIGHT = 28;
const PADDING = 6;
const ROW = "absolute inset-x-1.5 top-0 flex items-center gap-2 rounded-md px-2";

export type ColumnRole = "ancestor" | "current" | "revealed";

export interface PanelColumn {
  readonly depth: number;
  readonly name: string;
  readonly place: Place;
  readonly role: ColumnRole;
  readonly openKey: string | undefined;
}

export interface PanelControls {
  readonly pick: (column: PanelColumn, index: number, entry: Entry, modifiers: Modifiers) => void;
  readonly open: (place: Place, entry: Entry) => void;
  readonly clear: (column: PanelColumn) => void;
  readonly hover: (place: Place, entry: Entry | undefined) => void;
  readonly keyDown: (event: KeyboardEvent) => boolean;
  readonly takeFocus: () => boolean;
}

interface Props {
  readonly projectId: string;
  readonly elementId: string;
  readonly width: number;
  readonly column: PanelColumn;
  readonly selection: SelectionStore;
  readonly naming: NamingSlot | null;
  readonly defers: boolean;
  readonly controls: PanelControls;
}

const Notice = ({ children }: { readonly children: string }) => (
  <p className="px-3 py-2 text-subtle">{children}</p>
);

export const Column = memo(
  ({ projectId, elementId, width, column, selection, naming, defers, controls }: Props) => {
    const { place, role, openKey } = column;
    const draft = draftOf(naming);
    const isCurrent = role === "current";
    const { entries, isError } = useColumnEntries(projectId, place.directory, useSettled(defers));
    const viewportRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: entries?.length ?? 0,
      getScrollElement: () => viewportRef.current,
      estimateSize: () => ROW_HEIGHT,
      paddingStart: PADDING + (draft ? ROW_HEIGHT : 0),
      paddingEnd: PADDING,
      overscan: 12,
    });

    useRevealFocus(
      selection,
      (index) => virtualizer.scrollToIndex(index),
      isCurrent && entries !== undefined,
    );

    const openIndex = openKey && entries ? entries.findIndex((entry) => entryKey(entry.ref) === openKey) : -1;
    useLayoutEffect(() => {
      if (role === "ancestor" && openIndex >= 0) virtualizer.scrollToIndex(openIndex);
    }, [virtualizer, role, openIndex]);

    useLayoutEffect(() => {
      if (isCurrent && controls.takeFocus()) viewportRef.current?.focus({ preventScroll: true });
    }, [controls, isCurrent]);

    const hitOf = (event: MouseEvent) => {
      const index = itemIndexAt(event.target);
      const entry = index === null ? undefined : entries?.[index];
      return index !== null && entry ? { index, entry } : undefined;
    };

    const card = (
      <Card id={elementId} style={{ width }} className="flex h-full shrink-0 flex-col overflow-hidden">
        {isError ? <Notice>Couldn’t load this folder</Notice> : null}
        {entries?.length === 0 && !draft ? <Notice>Empty folder</Notice> : null}
        <ScrollArea
          ref={viewportRef}
          role="listbox"
          aria-label={column.name}
          aria-multiselectable={isCurrent}
          tabIndex={isCurrent ? 0 : -1}
          className="flex-1"
          onKeyDown={(event) => {
            if (!isCurrent || !entries) return;
            if (controls.keyDown(event)) event.preventDefault();
            else
              onListKey(
                event,
                { entries, selection, onOpen: (entry) => controls.open(place, entry) },
                verticalStep,
              );
          }}
          onClick={(event) => {
            const hit = hitOf(event);
            if (hit) controls.pick(column, hit.index, hit.entry, modifiersOf(event));
            else if (isPlain(event)) controls.clear(column);
          }}
          onDoubleClick={(event) => {
            const hit = hitOf(event);
            if (hit && isPlain(event)) controls.open(place, hit.entry);
          }}
          onPointerOver={(event) => controls.hover(place, hitOf(event)?.entry)}
          onPointerLeave={() => controls.hover(place, undefined)}
        >
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {draft ? (
              <div className={ROW} style={{ height: ROW_HEIGHT, transform: `translateY(${PADDING}px)` }}>
                <KindIcon kind={draft.kind} className="shrink-0" />
                {draft.field}
              </div>
            ) : null}
            {entries
              ? virtualizer.getVirtualItems().map((item) => {
                  const entry = entries[item.index];
                  if (!entry) return null;
                  const key = entryKey(entry.ref);
                  return (
                    <Row
                      key={key}
                      index={item.index}
                      start={item.start}
                      entry={entry}
                      field={fieldFor(naming, key)}
                      isOpen={key === openKey}
                      selection={selection}
                    />
                  );
                })
              : null}
          </div>
        </ScrollArea>
      </Card>
    );
    return place.directory ? (
      <ListingMenu
        directory={place.directory}
        entries={entries ?? []}
        selection={selection}
        disabled={!isCurrent}
      >
        {card}
      </ListingMenu>
    ) : (
      card
    );
  },
);

interface RowProps {
  readonly index: number;
  readonly start: number;
  readonly entry: Entry;
  readonly field: ReactElement | undefined;
  readonly isOpen: boolean;
  readonly selection: SelectionStore;
}

const Row = memo(({ index, start, entry, field, isOpen, selection }: RowProps) => {
  const selected = useIsSelected(selection, selectionId(entry));
  return (
    <div
      role="option"
      aria-selected={selected}
      data-index={index}
      title={entry.name}
      className={cn(
        ROW,
        "cursor-interactive",
        selected
          ? "bg-selected hover:bg-selected-hovered"
          : isOpen
            ? "bg-neutral hover:bg-neutral-hovered"
            : "hover:bg-neutral-subtle-hovered",
        entry.hidden && "opacity-50",
      )}
      style={{ height: ROW_HEIGHT, transform: `translateY(${start}px)` }}
    >
      <KindIcon kind={itemKindOf(entry)} className="shrink-0" />
      {field ?? <span className="min-w-0 flex-1 truncate">{entry.name}</span>}
      {entry.kind === "directory" ? (
        <Icon icon={ArrowRight01Icon} size={14} className="shrink-0 text-subtlest" />
      ) : null}
    </div>
  );
});
