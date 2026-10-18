import { memo } from 'react';

import { DEFAULT_NOTE_COLOR } from '../domain/constants';
import type { Note as NoteModel } from '../domain/types';
import { NOTE_COLOR_VALUES } from '../styles/noteColors';
import styles from './Note.module.css';

interface NoteProps {
  readonly note: NoteModel;
}

export const Note = memo(function Note({ note }: NoteProps) {
  return (
    <article
      className={styles.note}
      aria-label="Sticky note"
      style={{
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        backgroundColor: NOTE_COLOR_VALUES[note.color ?? DEFAULT_NOTE_COLOR],
      }}
    >
      <p className={styles.text}>{note.text}</p>
    </article>
  );
});
