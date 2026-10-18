import { useCallback } from 'react';

import { MIN_BOARD_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { NoteId, Point, Rect, Size } from '../domain/types';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotesDispatch, useNotesState } from '../state/NotesContext';
import styles from './Board.module.css';
import { Note } from './Note';
import { TrashZone } from './TrashZone';

export const Board = () => {
  const { notes } = useNotesState();
  const dispatch = useNotesDispatch();

  const handleCreate = useCallback(
    (rect: Rect, board: Size) => dispatch({ type: 'CREATE_NOTE', id: createNoteId(), rect, board }),
    [dispatch],
  );
  const handleBringToFront = useCallback(
    (id: NoteId) => dispatch({ type: 'BRING_TO_FRONT', id }),
    [dispatch],
  );
  const handleMove = useCallback(
    (id: NoteId, position: Point, board: Size) =>
      dispatch({ type: 'MOVE_NOTE', id, position, board }),
    [dispatch],
  );
  const handleResize = useCallback(
    (id: NoteId, size: Size, board: Size) => dispatch({ type: 'RESIZE_NOTE', id, size, board }),
    [dispatch],
  );
  const handleDelete = useCallback(
    (id: NoteId) => dispatch({ type: 'DELETE_NOTE', id }),
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
      <p className={styles.hint} aria-hidden="true">
        Double click to create a new note
      </p>
      {notes.map((note) => (
        <Note
          key={note.id}
          note={note}
          onBringToFront={handleBringToFront}
          onMove={handleMove}
          onResize={handleResize}
          onDelete={handleDelete}
        />
      ))}
      <TrashZone />
    </main>
  );
};
