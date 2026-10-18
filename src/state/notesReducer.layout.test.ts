import { describe, expect, it } from 'vitest';

import { MIN_NOTE_SIZE } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import type { NoteId, Size } from '../domain/types';
import { initialNotesState, notesReducer, type NotesState } from './notesReducer';
import { BOARD, createNote, findNote } from '../test/testHelpers';

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

  it('shifts the note back inside when the minimum size no longer fits next to the edge', () => {
    const { state, id } = createNote(initialNotesState, {
      x: 800,
      y: 600,
      width: 150,
      height: 150,
    });
    const smallBoard: Size = { width: 850, height: 650 };
    const resized = notesReducer(state, {
      type: 'RESIZE_NOTE',
      id,
      size: { width: 500, height: 500 },
      board: smallBoard,
    });

    expect(findNote(resized, id)).toMatchObject({
      ...MIN_NOTE_SIZE,
      x: smallBoard.width - MIN_NOTE_SIZE.width,
      y: smallBoard.height - MIN_NOTE_SIZE.height,
    });
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);

    expect(resize(state, createNoteId(), { width: 300, height: 300 })).toBe(state);
  });
});
