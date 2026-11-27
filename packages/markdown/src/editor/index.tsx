import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, placeholder as placeholderText } from "@codemirror/view";
import { cn } from "cn";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { changeBetween } from "#change.ts";
import { submitOnEnter, type Variant, variants, writing } from "./writing.ts";

export interface MarkdownEditorProps {
  readonly value: string;
  readonly label: string;
  readonly variant?: Variant;
  readonly editable?: boolean;
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly className?: string;
  readonly onChange?: (read: () => string) => void;
  readonly onSubmit?: () => void;
}

const settingsOf = (label: string, editable: boolean, placeholder: string | undefined) => [
  EditorView.contentAttributes.of({ "aria-label": label }),
  EditorView.editable.of(editable),
  EditorState.readOnly.of(!editable),
  placeholder ? placeholderText(placeholder) : [],
];

const isLocal = (transaction: Transaction) =>
  transaction.docChanged && !transaction.annotation(Transaction.remote);

export const MarkdownEditor = ({
  value,
  label,
  variant = "document",
  editable = true,
  placeholder,
  autoFocus = false,
  className,
  onChange,
  onSubmit,
}: MarkdownEditorProps) => {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const synced = useRef(value);
  const [initial] = useState({
    value,
    label,
    variant,
    editable,
    placeholder,
    autoFocus,
    submits: onSubmit !== undefined,
  });
  const [settings] = useState(() => new Compartment());
  const changed = useEffectEvent((read: () => string) => onChange?.(read));
  const submitted = useEffectEvent(() => onSubmit?.());

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          writing,
          variants[initial.variant],
          initial.submits ? submitOnEnter(submitted) : [],
          settings.of(settingsOf(initial.label, initial.editable, initial.placeholder)),
          EditorView.updateListener.of((update) => {
            if (update.transactions.some(isLocal)) changed(() => update.state.sliceDoc());
          }),
        ],
      }),
    });
    view.current = editor;
    if (initial.autoFocus) editor.focus();
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, [initial, settings]);

  useEffect(() => {
    view.current?.dispatch({ effects: settings.reconfigure(settingsOf(label, editable, placeholder)) });
  }, [settings, label, editable, placeholder]);

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

  return <div ref={host} data-variant={initial.variant} className={cn("markdown-editor", className)} />;
};
