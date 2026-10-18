import { describe, expect, it } from 'vitest';

import { createNoteId } from './noteId';

describe('createNoteId', () => {
  it('returns a UUID', () => {
    expect(createNoteId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('returns a different id on each call', () => {
    expect(createNoteId()).not.toBe(createNoteId());
  });
});
