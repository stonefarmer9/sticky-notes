import { describe, expect, it } from 'vitest';

import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { NoteId, Size } from '../domain/types';
import type { NotesAction } from './actions';
import { initialNotesState, notesReducer, type NotesState } from './notesReducer';
import { BOARD, createNote, findNote } from './testHelpers';

describe('CREATE_NOTE', () => {
  it('adds a note at the given position and size', () => {
    const { state, id } = createNote(initialNotesState);

    expect(findNote(state, id)).toMatchObject({ x: 100, y: 100, width: 200, height: 200 });
  });

  it('is deterministic and uses the id provided by the action', () => {
    const id = createNoteId();
    const rect = { x: 0, y: 0, width: 200, height: 200 };
    const action: NotesAction = { type: 'CREATE_NOTE', id, rect, board: BOARD };

    expect(notesReducer(initialNotesState, action)).toEqual(
      notesReducer(initialNotesState, action),
    );
    expect(notesReducer(initialNotesState, action).notes[0]?.id).toBe(id);
  });

  it('stacks each new note above the previous ones', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);

    expect(findNote(second.state, second.id).zIndex).toBeGreaterThan(
      findNote(second.state, first.id).zIndex,
    );
  });

  it('clamps the size to the allowed range', () => {
    const tiny = createNote(initialNotesState, { x: 0, y: 0, width: 1, height: 1 });
    const huge = createNote(initialNotesState, { x: 0, y: 0, width: 9999, height: 9999 });

    expect(findNote(tiny.state, tiny.id)).toMatchObject(MIN_NOTE_SIZE);
    expect(findNote(huge.state, huge.id)).toMatchObject(MAX_NOTE_SIZE);
  });

  it('keeps the note inside the board', () => {
    const { state, id } = createNote(initialNotesState, {
      x: -50,
      y: 5000,
      width: 200,
      height: 200,
    });

    expect(findNote(state, id)).toMatchObject({ x: 0, y: BOARD.height - 200 });
  });

  it('does not mutate the previous state', () => {
    const { state } = createNote(initialNotesState);

    expect(initialNotesState.notes).toHaveLength(0);
    expect(state.notes).toHaveLength(1);
  });
});

describe('MOVE_NOTE', () => {
  it('moves only the targeted note', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    const moved = notesReducer(second.state, {
      type: 'MOVE_NOTE',
      id: first.id,
      position: { x: 300, y: 400 },
      board: BOARD,
    });

    expect(findNote(moved, first.id)).toMatchObject({ x: 300, y: 400 });
    expect(findNote(moved, second.id)).toBe(findNote(second.state, second.id));
  });

  it('clamps the position to the board', () => {
    const { state, id } = createNote(initialNotesState);
    const moved = notesReducer(state, {
      type: 'MOVE_NOTE',
      id,
      position: { x: -100, y: 9999 },
      board: BOARD,
    });

    expect(findNote(moved, id)).toMatchObject({ x: 0, y: BOARD.height - 200 });
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);
    const moved = notesReducer(state, {
      type: 'MOVE_NOTE',
      id: createNoteId(),
      position: { x: 0, y: 0 },
      board: BOARD,
    });

    expect(moved).toBe(state);
  });
});

describe('RESIZE_NOTE', () => {
  const resize = (state: NotesState, id: NoteId, size: Size): NotesState =>
    notesReducer(state, { type: 'RESIZE_NOTE', id, size, board: BOARD });

  it('applies the new size and keeps the position', () => {
    const { state, id } = createNote(initialNotesState);

    expect(findNote(resize(state, id, { width: 300, height: 250 }), id)).toMatchObject({
      x: 100,
      y: 100,
      width: 300,
      height: 250,
    });
  });

  it('does not shrink below the minimum size', () => {
    const { state, id } = createNote(initialNotesState);

    expect(findNote(resize(state, id, { width: 1, height: 1 }), id)).toMatchObject(MIN_NOTE_SIZE);
  });

  it('does not grow beyond the maximum size', () => {
    const { state, id } = createNote(initialNotesState, { x: 0, y: 0, width: 200, height: 200 });

    expect(findNote(resize(state, id, { width: 9999, height: 9999 }), id)).toMatchObject(
      MAX_NOTE_SIZE,
    );
  });

  it('does not grow past the board edges', () => {
    const { state, id } = createNote(initialNotesState, {
      x: 800,
      y: 600,
      width: 150,
      height: 150,
    });
    const note = findNote(resize(state, id, { width: 500, height: 500 }), id);

    expect(note).toMatchObject({ x: 800, y: 600, width: 200, height: 200 });
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);

    expect(resize(state, createNoteId(), { width: 300, height: 300 })).toBe(state);
  });
});

describe('DELETE_NOTE', () => {
  it('removes only the targeted note', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    const deleted = notesReducer(second.state, { type: 'DELETE_NOTE', id: first.id });

    expect(deleted.notes.map((note) => note.id)).toEqual([second.id]);
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);

    expect(notesReducer(state, { type: 'DELETE_NOTE', id: createNoteId() })).toBe(state);
  });
});

describe('BRING_TO_FRONT', () => {
  it('moves the note above all others', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    const raised = notesReducer(second.state, { type: 'BRING_TO_FRONT', id: first.id });

    expect(findNote(raised, first.id).zIndex).toBeGreaterThan(findNote(raised, second.id).zIndex);
  });

  it('returns the same state when the note is already on top', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);

    expect(notesReducer(second.state, { type: 'BRING_TO_FRONT', id: second.id })).toBe(
      second.state,
    );
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);

    expect(notesReducer(state, { type: 'BRING_TO_FRONT', id: createNoteId() })).toBe(state);
  });
});
