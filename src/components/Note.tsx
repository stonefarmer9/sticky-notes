import { memo, useCallback, useRef, type KeyboardEvent } from 'react';

import { DEFAULT_NOTE_COLOR } from '../domain/constants';
import type { Note as NoteModel, Point, Size } from '../domain/types';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import { NOTE_COLOR_VALUES } from '../styles/noteColors';
import { toTranslate3d } from '../styles/transform';
import styles from './Note.module.css';
import type { NoteActions } from './noteActions';
import { NoteEditor } from './NoteEditor';
import { ResizeHandle } from './ResizeHandle';

interface NoteProps {
  readonly note: NoteModel;
  readonly isEditing: boolean;
  readonly actions: NoteActions;
}

export const Note = memo(function Note({ note, isEditing, actions }: NoteProps) {
  const { bringToFront, move, resize, remove, startEditing, stopEditing, updateText } = actions;
  const articleRef = useRef<HTMLElement>(null);

  const handleStart = useCallback(() => bringToFront(note.id), [bringToFront, note.id]);
  const handleMoveEnd = useCallback(
    (position: Point, board: Size) => move(note.id, position, board),
    [move, note.id],
  );
  const handleResizeEnd = useCallback(
    (size: Size, board: Size) => resize(note.id, size, board),
    [resize, note.id],
  );
  const handleTrash = useCallback(() => remove(note.id), [remove, note.id]);
  const dragHandlers = useDrag({
    rect: note,
    onStart: handleStart,
    onEnd: handleMoveEnd,
    onTrash: handleTrash,
  });
  const resizeHandlers = useResize({ rect: note, onStart: handleStart, onEnd: handleResizeEnd });

  const handleCommit = useCallback(
    (text: string) => {
      if (text !== (note.text ?? '')) {
        updateText(note.id, text);
      }
      stopEditing();
    },
    [note.id, note.text, updateText, stopEditing],
  );
  const handleCancel = useCallback(() => {
    stopEditing();
    articleRef.current?.focus();
  }, [stopEditing]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && event.target === event.currentTarget) {
      event.preventDefault();
      startEditing(note.id);
    }
  };

  return (
    <article
      ref={articleRef}
      className={styles.note}
      aria-label="Sticky note"
      tabIndex={0}
      style={{
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        transform: toTranslate3d(note),
        backgroundColor: NOTE_COLOR_VALUES[note.color ?? DEFAULT_NOTE_COLOR],
      }}
      onDoubleClick={() => startEditing(note.id)}
      onKeyDown={handleKeyDown}
      {...dragHandlers}
    >
      {isEditing ? (
        <NoteEditor initialText={note.text ?? ''} onCommit={handleCommit} onCancel={handleCancel} />
      ) : (
        <p className={styles.text}>{note.text}</p>
      )}
      <ResizeHandle {...resizeHandlers} />
    </article>
  );
});
