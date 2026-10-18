import { describe, expect, it } from 'vitest';

import { createNoteId } from '../domain/noteId';
import { initialNotesState, notesReducer } from './notesReducer';
import { createNote, findNote } from '../test/testHelpers';

describe('UPDATE_TEXT', () => {
  it('sets the text of the targeted note', () => {
    const { state, id } = createNote(initialNotesState);

    const updated = notesReducer(state, { type: 'UPDATE_TEXT', id, text: 'Buy milk' });

    expect(findNote(updated, id).text).toBe('Buy milk');
  });

  it('leaves the other notes untouched', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);

    const updated = notesReducer(second.state, { type: 'UPDATE_TEXT', id: first.id, text: 'a' });

    expect(findNote(updated, second.id)).toBe(findNote(second.state, second.id));
  });

  it('keeps position, size and stacking', () => {
    const { state, id } = createNote(initialNotesState);
    const before = findNote(state, id);

    const after = findNote(notesReducer(state, { type: 'UPDATE_TEXT', id, text: 'x' }), id);

    expect(after).toEqual({ ...before, text: 'x' });
  });

  it('can clear the text', () => {
    const { state, id } = createNote(initialNotesState);
    const withText = notesReducer(state, { type: 'UPDATE_TEXT', id, text: 'x' });

    expect(findNote(notesReducer(withText, { type: 'UPDATE_TEXT', id, text: '' }), id).text).toBe(
      '',
    );
  });

  it('returns the same state when the text is unchanged', () => {
    const { state, id } = createNote(initialNotesState);
    const withText = notesReducer(state, { type: 'UPDATE_TEXT', id, text: 'x' });

    expect(notesReducer(withText, { type: 'UPDATE_TEXT', id, text: 'x' })).toBe(withText);
  });

  it('returns the same state for an unknown id', () => {
    const { state } = createNote(initialNotesState);

    expect(notesReducer(state, { type: 'UPDATE_TEXT', id: createNoteId(), text: 'x' })).toBe(state);
  });
});
