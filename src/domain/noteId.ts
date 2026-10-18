import type { NoteId } from './types';

export const createNoteId = (): NoteId =>
  // The brand exists only at the type level; randomUUID() output is the runtime value.
  crypto.randomUUID() as NoteId;
