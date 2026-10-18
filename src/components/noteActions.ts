import type { NoteId, Point, Size } from '../domain/types';

// Grouped so the Note props stay small. Board creates one stable object; its identity never changes.
export interface NoteActions {
  readonly bringToFront: (id: NoteId) => void;
  readonly move: (id: NoteId, position: Point, board: Size) => void;
  readonly resize: (id: NoteId, size: Size, board: Size) => void;
  readonly remove: (id: NoteId) => void;
  readonly startEditing: (id: NoteId) => void;
  readonly stopEditing: () => void;
  readonly updateText: (id: NoteId, text: string) => void;
}
