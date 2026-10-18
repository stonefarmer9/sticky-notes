import { describe, expect, it } from 'vitest';

import { createNoteId } from './noteId';

describe('createNoteId', () => {
  it('returns a non-empty string', () => {
    const id = createNoteId();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns a different id on each call', () => {
    expect(createNoteId()).not.toBe(createNoteId());
  });
});
