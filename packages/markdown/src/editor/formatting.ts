import { EditorSelection, type EditorState, type SelectionRange } from "@codemirror/state";
import type { EditorView, KeyBinding } from "@codemirror/view";

const wrappingOf = (state: EditorState, { from, to }: SelectionRange, marker: string) => {
  const size = marker.length;
  const text = state.sliceDoc(from, to);
  if (text.length >= size * 2 && text.startsWith(marker) && text.endsWith(marker)) return "inside";
  if (state.sliceDoc(from - size, from) === marker && state.sliceDoc(to, to + size) === marker)
    return "outside";
  return undefined;
};

const toggle = (marker: string) => (view: EditorView) => {
  if (view.state.readOnly) return false;
  const size = marker.length;
  view.dispatch(
    view.state.changeByRange((range) => {
      const { from, to } = range;
      switch (wrappingOf(view.state, range, marker)) {
        case "inside":
          return {
            changes: [
              { from, to: from + size },
              { from: to - size, to },
            ],
            range: EditorSelection.range(from, to - size * 2),
          };
        case "outside":
          return {
            changes: [
              { from: from - size, to: from },
              { from: to, to: to + size },
            ],
            range: EditorSelection.range(from - size, to - size),
          };
        case undefined:
          return {
            changes: [
              { from, insert: marker },
              { from: to, insert: marker },
            ],
            range: EditorSelection.range(from + size, to + size),
          };
      }
    }),
    { scrollIntoView: true },
  );
  return true;
};

export const formattingKeymap: ReadonlyArray<KeyBinding> = [
  { key: "Mod-b", run: toggle("**") },
  { key: "Mod-i", run: toggle("_") },
  { key: "Mod-e", run: toggle("`") },
  { key: "Mod-Shift-x", run: toggle("~~") },
];
