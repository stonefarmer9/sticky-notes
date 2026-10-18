import { createNoteId } from '../domain/noteId';
import type { Note, NoteId, Rect, Size } from '../domain/types';
import { notesReducer, type NotesState } from './notesReducer';

export const BOARD: Size = { width: 1000, height: 800 };

const DEFAULT_RECT: Rect = { x: 100, y: 100, width: 200, height: 200 };

export const createNote = (
  state: NotesState,
  rect: Rect = DEFAULT_RECT,
): { state: NotesState; id: NoteId } => {
  const id = createNoteId();
  return { id, state: notesReducer(state, { type: 'CREATE_NOTE', id, rect, board: BOARD }) };
};

export const findNote = (state: NotesState, id: NoteId): Note => {
  const note = state.notes.find((candidate) => candidate.id === id);
  if (note === undefined) {
    throw new Error(`Note ${id} not found`);
  }
  return note;
};
