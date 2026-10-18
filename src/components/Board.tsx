import { useCallback, useMemo, useState } from 'react';

import { MIN_BOARD_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { NoteId, Rect, Size } from '../domain/types';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotesDispatch, useNotesState } from '../state/NotesContext';
import styles from './Board.module.css';
import { Note } from './Note';
import type { NoteActions } from './noteActions';
import { TrashZone } from './TrashZone';

export const Board = () => {
  const { notes } = useNotesState();
  const dispatch = useNotesDispatch();

  const [editingId, setEditingId] = useState<NoteId | null>(null);

  const actions = useMemo<NoteActions>(
    () => ({
      bringToFront: (id) => dispatch({ type: 'BRING_TO_FRONT', id }),
      move: (id, position, board) => dispatch({ type: 'MOVE_NOTE', id, position, board }),
      resize: (id, size, board) => dispatch({ type: 'RESIZE_NOTE', id, size, board }),
      remove: (id) => dispatch({ type: 'DELETE_NOTE', id }),
      startEditing: setEditingId,
      stopEditing: () => setEditingId(null),
      updateText: (id, text) => dispatch({ type: 'UPDATE_TEXT', id, text }),
    }),
    [dispatch],
  );
  const handleCreate = useCallback(
    (rect: Rect, board: Size) => {
      const id = createNoteId();
      dispatch({ type: 'CREATE_NOTE', id, rect, board });
      setEditingId(id);
    },
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
        <Note key={note.id} note={note} isEditing={note.id === editingId} actions={actions} />
      ))}
      <TrashZone />
    </main>
  );
};
