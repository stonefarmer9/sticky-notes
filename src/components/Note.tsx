import { memo, useCallback } from 'react';

import { DEFAULT_NOTE_COLOR } from '../domain/constants';
import type { Note as NoteModel, NoteId, Point, Size } from '../domain/types';
import { useDrag } from '../hooks/useDrag';
import { NOTE_COLOR_VALUES } from '../styles/noteColors';
import { toTranslate3d } from '../styles/transform';
import styles from './Note.module.css';

interface NoteProps {
  readonly note: NoteModel;
  readonly onBringToFront: (id: NoteId) => void;
  readonly onMove: (id: NoteId, position: Point, board: Size) => void;
}

export const Note = memo(function Note({ note, onBringToFront, onMove }: NoteProps) {
  const handleStart = useCallback(() => onBringToFront(note.id), [onBringToFront, note.id]);
  const handleEnd = useCallback(
    (position: Point, board: Size) => onMove(note.id, position, board),
    [onMove, note.id],
  );
  const dragHandlers = useDrag({ rect: note, onStart: handleStart, onEnd: handleEnd });

  return (
    <article
      className={styles.note}
      aria-label="Sticky note"
      style={{
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        transform: toTranslate3d(note),
        backgroundColor: NOTE_COLOR_VALUES[note.color ?? DEFAULT_NOTE_COLOR],
      }}
      {...dragHandlers}
    >
      <p className={styles.text}>{note.text}</p>
    </article>
  );
});
