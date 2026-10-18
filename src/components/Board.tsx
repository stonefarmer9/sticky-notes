import { useCallback } from 'react';

import { MIN_BOARD_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { Rect, Size } from '../domain/types';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotesDispatch, useNotesState } from '../state/NotesContext';
import styles from './Board.module.css';
import { Note } from './Note';

export const Board = () => {
  const { notes } = useNotesState();
  const dispatch = useNotesDispatch();

  const handleCreate = useCallback(
    (rect: Rect, board: Size) => dispatch({ type: 'CREATE_NOTE', id: createNoteId(), rect, board }),
    [dispatch],
  );
  const { onDoubleClick } = useCreateNote({ onCreate: handleCreate });

  return (
    <main
      className={styles.board}
      aria-label="Sticky notes board"
      style={{ minWidth: MIN_BOARD_SIZE.width, minHeight: MIN_BOARD_SIZE.height }}
      onDoubleClick={onDoubleClick}
    >
      {notes.map((note) => (
        <Note key={note.id} note={note} />
      ))}
    </main>
  );
};
