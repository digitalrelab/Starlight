import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { cn } from "cn";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { changeBetween } from "../change.ts";
import { writing } from "./writing.ts";

export interface MarkdownEditorProps {
  readonly value: string;
  readonly label: string;
  readonly editable?: boolean;
  readonly className?: string;
  readonly onChange?: (read: () => string) => void;
}

const settingsOf = (label: string, editable: boolean) => [
  EditorView.contentAttributes.of({ "aria-label": label }),
  EditorView.editable.of(editable),
  EditorState.readOnly.of(!editable),
];

const isLocal = (transaction: Transaction) =>
  transaction.docChanged && !transaction.annotation(Transaction.remote);

export const MarkdownEditor = ({
  value,
  label,
  editable = false,
  className,
  onChange,
}: MarkdownEditorProps) => {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const synced = useRef(value);
  const [initial] = useState({ value, label, editable });
  const [settings] = useState(() => new Compartment());
  const changed = useEffectEvent((read: () => string) => onChange?.(read));

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          writing,
          settings.of(settingsOf(initial.label, initial.editable)),
          EditorView.updateListener.of((update) => {
            if (update.transactions.some(isLocal)) changed(() => update.state.sliceDoc());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, [initial, settings]);

  useEffect(() => {
    view.current?.dispatch({ effects: settings.reconfigure(settingsOf(label, editable)) });
  }, [settings, label, editable]);

  useEffect(() => {
    const editor = view.current;
    if (!editor || value === synced.current) return;
    synced.current = value;
    const change = changeBetween(editor.state.sliceDoc(), value);
    if (!change) return;
    editor.dispatch({
      changes: { from: change.fromA, to: change.toA, insert: value.slice(change.fromB, change.toB) },
      annotations: [Transaction.remote.of(true), Transaction.addToHistory.of(false)],
    });
  }, [value]);

  return <div ref={host} className={cn("markdown-editor", className)} />;
};
