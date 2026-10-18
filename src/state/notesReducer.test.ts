import { describe, expect, it } from 'vitest';

import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { NotesAction } from './actions';
import { initialNotesState, notesReducer, type NotesState } from './notesReducer';
import { BOARD, createNote, deepFreeze, findNote } from '../test/testHelpers';

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

  it('stacks above the highest remaining note after a deletion', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    const afterDelete = notesReducer(second.state, { type: 'DELETE_NOTE', id: first.id });
    const third = createNote(afterDelete);

    expect(findNote(third.state, third.id).zIndex).toBeGreaterThan(
      findNote(third.state, second.id).zIndex,
    );
  });

  it('does not mutate the previous state', () => {
    const before = deepFreeze<NotesState>({ notes: [] });
    const rect = { x: 0, y: 0, width: 200, height: 200 };
    const after = notesReducer(before, {
      type: 'CREATE_NOTE',
      id: createNoteId(),
      rect,
      board: BOARD,
    });

    expect(before.notes).toHaveLength(0);
    expect(after.notes).toHaveLength(1);
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
