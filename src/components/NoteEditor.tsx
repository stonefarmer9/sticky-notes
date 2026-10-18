import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';

import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  readonly initialText: string;
  readonly onCommit: (text: string) => void;
  readonly onCancel: () => void;
}

// A press inside the editor must never reach the note, or selecting text would start a drag.
const stopPointerDown = (event: PointerEvent<HTMLTextAreaElement>) => event.stopPropagation();

export const NoteEditor = ({ initialText, onCommit, onCancel }: NoteEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Commit and cancel are final: unmounting a focused textarea can still fire a blur afterwards.
  const settledRef = useRef(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea !== null) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, []);

  const settle = (action: () => void) => {
    if (!settledRef.current) {
      settledRef.current = true;
      action();
    }
  };

  const handleBlur = (event: FocusEvent<HTMLTextAreaElement>) =>
    settle(() => onCommit(event.currentTarget.value));

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      settle(onCancel);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className={styles.editor}
      aria-label="Note text"
      defaultValue={initialText}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPointerDown={stopPointerDown}
    />
  );
};
