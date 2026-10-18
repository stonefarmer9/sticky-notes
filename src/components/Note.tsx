import { memo, useCallback } from 'react';

import { DEFAULT_NOTE_COLOR } from '../domain/constants';
import type { Note as NoteModel, NoteId, Point, Size } from '../domain/types';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import { NOTE_COLOR_VALUES } from '../styles/noteColors';
import { toTranslate3d } from '../styles/transform';
import styles from './Note.module.css';
import { ResizeHandle } from './ResizeHandle';

interface NoteProps {
  readonly note: NoteModel;
  readonly onBringToFront: (id: NoteId) => void;
  readonly onMove: (id: NoteId, position: Point, board: Size) => void;
  readonly onResize: (id: NoteId, size: Size, board: Size) => void;
}

export const Note = memo(function Note({ note, onBringToFront, onMove, onResize }: NoteProps) {
  const handleStart = useCallback(() => onBringToFront(note.id), [onBringToFront, note.id]);
  const handleEnd = useCallback(
    (position: Point, board: Size) => onMove(note.id, position, board),
    [onMove, note.id],
  );
  const handleResizeEnd = useCallback(
    (size: Size, board: Size) => onResize(note.id, size, board),
    [onResize, note.id],
  );
  const dragHandlers = useDrag({ rect: note, onStart: handleStart, onEnd: handleEnd });
  const resizeHandlers = useResize({ rect: note, onStart: handleStart, onEnd: handleResizeEnd });

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
      <ResizeHandle {...resizeHandlers} />
    </article>
  );
});
