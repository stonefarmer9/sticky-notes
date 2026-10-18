import { clampSize, clampToBoard, maxSizeWithin, resizeWithinBoard } from '../domain/geometry';
import type { Note, NoteId } from '../domain/types';
import type { NotesAction } from './actions';

export interface NotesState {
  readonly notes: readonly Note[];
}

export const initialNotesState: NotesState = { notes: [] };

const topZIndex = (notes: readonly Note[]): number =>
  notes.reduce((top, note) => Math.max(top, note.zIndex), 0);

// Returns the same state when nothing changes, so React skips the re-render.
const updateNote = (state: NotesState, id: NoteId, update: (note: Note) => Note): NotesState => {
  const index = state.notes.findIndex((note) => note.id === id);
  const note = state.notes[index];
  if (note === undefined) {
    return state;
  }
  const updated = update(note);
  return updated === note ? state : { notes: state.notes.with(index, updated) };
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled action: ${JSON.stringify(value)}`);
};

export const notesReducer = (state: NotesState, action: NotesAction): NotesState => {
  switch (action.type) {
    case 'CREATE_NOTE': {
      const { id, rect, board } = action;
      const size = clampSize(rect, maxSizeWithin({ x: 0, y: 0 }, board));
      const note: Note = clampToBoard(
        { id, x: rect.x, y: rect.y, ...size, zIndex: topZIndex(state.notes) + 1 },
        board,
      );
      return { notes: [...state.notes, note] };
    }

    case 'MOVE_NOTE':
      return updateNote(state, action.id, (note) =>
        clampToBoard({ ...note, ...action.position }, action.board),
      );

    case 'RESIZE_NOTE':
      return updateNote(state, action.id, (note) =>
        resizeWithinBoard(note, action.size, action.board),
      );

    case 'DELETE_NOTE': {
      const notes = state.notes.filter((note) => note.id !== action.id);
      return notes.length === state.notes.length ? state : { notes };
    }

    case 'BRING_TO_FRONT': {
      const top = topZIndex(state.notes);
      return updateNote(state, action.id, (note) =>
        note.zIndex === top ? note : { ...note, zIndex: top + 1 },
      );
    }

    default:
      return assertNever(action);
  }
};
